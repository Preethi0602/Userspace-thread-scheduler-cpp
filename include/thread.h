#define _XOPEN_SOURCE 600
#pragma once

#include <ucontext.h>
#include <string>

//How much stack memory each thread gets (1MB)
#define STACK_SIZE (1024 * 1024)

//Possible states a thread can be in
enum class ThreadState {
    READY,      // Waiting to run
    RUNNING,    // Currently on CPU
    BLOCKED,    // Waiting for mutex/semaphore
    FINISHED    // Done executing
};

//Thread Control Block (Everything we need to know about a thread)
struct TCB {
    int id;                    // Unique thread ID
    std::string name;          // Human readable label
    ThreadState state;         // Current State
    ucontext_t context;        // Saved CPU context (registers, PC, SP)   
    char stack[STACK_SIZE];    // This thread's stack memory
    int priority;              // For priority scheduling (higher = more important)
    double vruntime;           // For CFS (total CPU time consumed so far)
    void(*func)() = nullptr;   // the function this thread runs

    // Constructor
    TCB (int id, std::string name, int priority = 0)
        : id(id),
          name(name),
          state(ThreadState::READY),
          priority(priority),
          vruntime(0.0){}
};
// Utility (print thread info)
void printTCB(const TCB* tcb);