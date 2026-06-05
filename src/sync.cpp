#include "../include/sync.h"
#include "../include/scheduler.h"
#include <iostream>

// MUTEX

void Mutex::lock() {
    TCB* caller = gScheduler->currentThread();

    if (!locked) {
        // Mutex is free (grab it)
        locked = true;
        owner  = caller;
        std::cout << "[Mutex] Thread " << caller->name 
                  << " acquired lock\n";
    } else {
        // Mutex is taken (block this thread)
        std::cout << "[Mutex] Thread " << caller->name 
                  << " blocked - waiting for lock\n";
        caller->state = ThreadState::BLOCKED;
        waitQueue.push(caller);

        // Yield to scheduler (someone else runs)
        gScheduler->yield();
    }
}

void Mutex::unlock() {
    TCB* caller = gScheduler->currentThread();

    if (owner != caller) {
        std::cout << "[Mutex] Error: non-owner trying to unlock!\n";
        return;
    }

    std::cout << "[Mutex] Thread " << caller->name 
              << " released lock\n";

    if (!waitQueue.empty()) {
        // Wake up next waiting thread
        TCB* next = waitQueue.front();
        waitQueue.pop();
        next->state = ThreadState::READY;
        locked = true;
        owner  = next;

        // Put it back in run queue
        // We access scheduler's run queue via a helper
        std::cout << "[Mutex] Thread " << next->name 
                  << " unblocked\n";
    } else {
        // Nobody waiting (just release)
        locked = false;
        owner  = nullptr;
    }
}

// SEMAPHORE 

void Semaphore::wait() {
    TCB* caller = gScheduler->currentThread();

    if (count > 0) {
        // Resource available
        count--;
        std::cout << "[Semaphore] Thread " << caller->name 
                  << " acquired resource, count=" << count << "\n";
    } else {
        // No resources (block)
        std::cout << "[Semaphore] Thread " << caller->name 
                  << " blocked - count=0\n";
        caller->state = ThreadState::BLOCKED;
        waitQueue.push(caller);
        gScheduler->yield();
    }
}

void Semaphore::signal() {
    TCB* caller = gScheduler->currentThread();

    if (!waitQueue.empty()) {
        // Wake up a waiting thread
        TCB* next = waitQueue.front();
        waitQueue.pop();
        next->state = ThreadState::READY;
        std::cout << "[Semaphore] Thread " << next->name 
                  << " unblocked\n";
    } else {
        // Nobody waiting (just increment)
        count++;
        std::cout << "[Semaphore] Signal by " << caller->name 
                  << ", count=" << count << "\n";
    }
}