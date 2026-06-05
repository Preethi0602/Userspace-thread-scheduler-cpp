#include "../include/scheduler.h"
#include "../include/sync.h"
#include "../include/thread.h"
#include <iostream>

//Demo 1: Basic Round Robin

void threadA() {
    std::cout << "[Thread A] Step 1\n";
    gScheduler->yield();
    std::cout << "[Thread A] Step 2\n";
    gScheduler->yield();
    std::cout << "[Thread A] Step 3 (Done\n)";
}

void threadB() {
    std::cout << "[Thread B] Step 1\n";
    gScheduler->yield();
    std::cout << "[Thread B] Step 2\n";
    gScheduler->yield();
    std::cout << "[Thread B] Step 3 (Done\n)";
}

void threadC() {
    std::cout << "[Thread C] Step 1\n";
    gScheduler->yield();
    std::cout << "[Thread C] Step 2 (Done\n)";
}

//Demo 2: Producer Consumer

Semaphore* items  = nullptr;  // how many items produced
Semaphore* spaces = nullptr;  // how many spaces in buffer
Mutex*     bufMutex = nullptr;
int buffer = 0;

void producer() {
    for (int i = 1; i <= 3; i++) {
        spaces->wait();       // wait for space
        bufMutex->lock();     // lock buffer
        buffer = i;
        std::cout << "[Producer] Produced item " << i << "\n";
        bufMutex->unlock();   // unlock buffer
        items->signal();      // signal item available
        gScheduler->yield();
    }
}

void consumer() {
    for (int i = 1; i <= 3; i++) {
        items->wait();        // wait for item
        bufMutex->lock();     // lock buffer
        std::cout << "[Consumer] Consumed item " << buffer << "\n";
        bufMutex->unlock();   // unlock buffer
        spaces->signal();     // signal space available
        gScheduler->yield();
    }
}

//MAIN 

int main() {
    //Demo 1: Round Robin
    std::cout << "\n DEMO 1: Round Robin \n";
    gScheduler = new Scheduler(SchedulingPolicy::ROUND_ROBIN);
    gScheduler->createThread("ThreadA", threadA);
    gScheduler->createThread("ThreadB", threadB);
    gScheduler->createThread("ThreadC", threadC);
    gScheduler->run();
    delete gScheduler;

    //Demo 2: Producer Consumer
    std::cout << "\n DEMO 2: Producer-Consumer \n";
    items    = new Semaphore(0);  // starts empty
    spaces   = new Semaphore(5);  // buffer has 5 spaces
    bufMutex = new Mutex();

    gScheduler = new Scheduler(SchedulingPolicy::ROUND_ROBIN);
    gScheduler->createThread("Producer", producer);
    gScheduler->createThread("Consumer", consumer);
    gScheduler->run();
    delete gScheduler;

    //Demo 3: Priority Scheduling
    std::cout << "\n DEMO 3: Priority Scheduling \n";
    gScheduler = new Scheduler(SchedulingPolicy::PRIORITY);
    gScheduler->createThread("LowPriority",    threadA, 1);
    gScheduler->createThread("HighPriority",   threadB, 10);
    gScheduler->createThread("MediumPriority", threadC, 5);
    gScheduler->run();
    delete gScheduler;

    return 0;
}