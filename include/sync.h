#pragma once
#include <queue>

//Forward Declaration (scheduler uses TCB, sync uses scheduler)

struct TCB;

//Mutex (only one thread can hold it at a time)

struct Mutex {
    bool locked;                    // Is it currently held?
    TCB* owner;                     // which thread holds it
    std::queue<TCB*> waitQueue;     // threads blocked waiting for it

    Mutex():locked(false),owner(nullptr){}

    void lock();                    // Acquire (block if already locked)
    void unlock();                  // Release (Wake a waiting thread)
};

// Semaphore ( a counter for resource access)
struct Semaphore{
    int count;                      // Available resources
    std::queue<TCB*> waitQueue;     // Threads blocked waiting

    Semaphore (int initial):count(initial){}

    void wait();                    // decrement (block if count is 0)
    void signal();                  // increment (wake a waiting thread)

};
class Scheduler;
extern Scheduler* gScheduler;