#pragma once

#include "thread.h"
#include <vector>
#include <queue>
#include <memory>

//Scheduling Policies available
enum class SchedulingPolicy{
    ROUND_ROBIN,
    PRIORITY,
    CFS
};

class Scheduler{
    public:
       // Constructor (choose your scheduling policy)
       Scheduler(SchedulingPolicy policy = SchedulingPolicy::ROUND_ROBIN);

       // Create a new thread and add it to run queue
       // func = the function this thread will run 
       void createThread (const std::string& name, void(*func)(),int priority = 0);

       // Voluntarily give up CPU (Cooperative yield)
       void yield();

       // Start the schedular (runs untill all threads finish)
       void run();

       //Called by a thread when it finishes 
       void threadFinished();
       void runCurrentThread();   

       // Get currently running thread (useful for sync primitives)
       TCB* currentThread();

    private:
       std::vector<TCB*> allThreads;   // all threads ever created
       std::queue<TCB*> runQueue;      // threads ready to run (round robim)
       TCB* current;                   // currently running thread 
       ucontext_t mainContext;         // schedular's own context  
       SchedulingPolicy policy;          // which algo to use
       int nextId;                     //counter for assigning Thread ID's

       // Internal: pick next thread based on Policy
       TCB* pickNext();
       
       // Internal: Context switch to a specific thread
       void switchTo(TCB* thread);
       
};


// Global schedular instance ( accesible from anywhere)
extern Scheduler* gScheduler; 
