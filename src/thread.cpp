#include "../include/thread.h"
#include <iostream>

// Nothing much here (TCB is a struct so constructor)
// is defined inline in thread.h
// This file is reserved for any future TCB helper methods

void printTCB(const TCB* tcb) {
    std::string stateStr;
    switch(tcb->state) {
        case ThreadState::READY:    stateStr = "READY";    break;
        case ThreadState::RUNNING:  stateStr = "RUNNING";  break;
        case ThreadState::BLOCKED:  stateStr = "BLOCKED";  break;
        case ThreadState::FINISHED: stateStr = "FINISHED"; break;
    }
    std::cout << "[TCB] ID=" << tcb->id 
              << " Name=" << tcb->name
              << " State=" << stateStr
              << " Priority=" << tcb->priority
              << " VRuntime=" << tcb->vruntime << "\n";
}