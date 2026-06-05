#define _XOPEN_SOURCE 600
#include "../include/scheduler.h"
#include <iostream>

// Global scheduler instance
Scheduler* gScheduler = nullptr;

// This wrapper is what ACTUALLY runs as the thread function
// It calls the real function, then calls threadFinished()
static void threadEntry() {
    // Get the current thread's stored function and call it
    gScheduler->runCurrentThread();
    // When function returns, mark as finished
    gScheduler->threadFinished();
}

// Constructor
Scheduler::Scheduler(SchedulingPolicy policy)
    : current(nullptr),
      policy(policy),
      nextId(0) {}

// Create a new thread
void Scheduler::createThread(const std::string& name, void(*func)(), int priority) {
    TCB* tcb = new TCB(nextId++, name, priority);
    tcb->func = func;  // store the function pointer in TCB

    getcontext(&tcb->context);
    tcb->context.uc_stack.ss_sp   = tcb->stack;
    tcb->context.uc_stack.ss_size = STACK_SIZE;
    tcb->context.uc_link          = nullptr;

    // Use wrapper so threadFinished() is always called
    makecontext(&tcb->context, threadEntry, 0);

    allThreads.push_back(tcb);
    runQueue.push(tcb);

    std::cout << "[Scheduler] Created thread: " << name << "\n";
}

// Called by threadEntry to run the actual function
void Scheduler::runCurrentThread() {
    if (current && current->func) {
        current->func();
    }
}

// Pick next thread based on policy
TCB* Scheduler::pickNext() {
    if (runQueue.empty()) return nullptr;

    if (policy == SchedulingPolicy::ROUND_ROBIN) {
        TCB* next = runQueue.front();
        runQueue.pop();
        return next;
    }

    if (policy == SchedulingPolicy::PRIORITY) {
        TCB* highest = nullptr;
        std::queue<TCB*> temp;
        while (!runQueue.empty()) {
            TCB* t = runQueue.front();
            runQueue.pop();
            if (!highest || t->priority > highest->priority) {
                if (highest) temp.push(highest);
                highest = t;
            } else {
                temp.push(t);
            }
        }
        runQueue = temp;
        return highest;
    }

    if (policy == SchedulingPolicy::CFS) {
        TCB* least = nullptr;
        std::queue<TCB*> temp;
        while (!runQueue.empty()) {
            TCB* t = runQueue.front();
            runQueue.pop();
            if (!least || t->vruntime < least->vruntime) {
                if (least) temp.push(least);
                least = t;
            } else {
                temp.push(t);
            }
        }
        runQueue = temp;
        return least;
    }

    return nullptr;
}

// Yield -- jump back to scheduler loop
void Scheduler::yield() {
    if (current == nullptr) return;

    TCB* prev = current;
    prev->state = ThreadState::READY;
    prev->vruntime += 1.0;
    runQueue.push(prev);
    current = nullptr;

    swapcontext(&prev->context, &mainContext);
}

// Thread finished -- jump back to scheduler loop
void Scheduler::threadFinished() {
    std::cout << "[Thread " << current->id
              << " - " << current->name << "] Finished\n";

    current->state = ThreadState::FINISHED;
    TCB* prev = current;
    current = nullptr;

    swapcontext(&prev->context, &mainContext);
}

// Main scheduler loop
void Scheduler::run() {
    std::cout << "[Scheduler] Starting...\n";

    while (true) {
        TCB* next = pickNext();
        if (!next) break;

        next->state = ThreadState::RUNNING;
        current = next;

        swapcontext(&mainContext, &next->context);
    }

    std::cout << "[Scheduler] All threads finished\n";

    for (TCB* t : allThreads) delete t;
    allThreads.clear();
}

// Return currently running thread
TCB* Scheduler::currentThread() {
    return current;
}