# Thread Scheduler in C++

A userspace thread scheduler implemented from scratch in C++ using `ucontext_t`,
without relying on any OS threading libraries like pthreads.

Built to deeply understand how operating systems manage threads, context switching,
and CPU scheduling under the hood.

---

## Features

- Cooperative and preemptive thread scheduling
- Three scheduling policies: Round Robin, Priority, CFS-inspired
- Mutex and Semaphore synchronization primitives
- Demo: Producer-Consumer and Reader-Writer problems

---

## Concepts Demonstrated

- How a CPU context switch works (saving/restoring registers, stack pointer, program counter)
- Thread Control Block (TCB) design
- Run queue management
- Scheduling algorithms: Round Robin, Priority, Completely Fair Scheduler (CFS)
- Synchronization primitives to prevent race conditions
- Deadlock avoidance patterns

---

## Build & Run

### Requirements
- macOS or Linux
- g++ with C++17 support

### Commands

    make
    make run
    make clean

---

## Project Structure

    thread-scheduler-cpp/
    ├── include/
    │   ├── thread.h        → Thread Control Block (TCB) definition
    │   ├── scheduler.h     → Scheduler class (Round Robin, Priority, CFS)
    │   └── sync.h          → Mutex and Semaphore definitions
    ├── src/
    │   ├── thread.cpp      → TCB implementation
    │   ├── scheduler.cpp   → Scheduling logic
    │   └── sync.cpp        → Mutex and Semaphore implementation
    ├── tests/
    │   └── main.cpp        → Demo: producer-consumer, reader-writer
    ├── docs/
    │   └── notes.md        → Concept notes and diagrams
    ├── Makefile            → Build system
    └── README.md           → You are here

---

## How It Works

### Thread Control Block (TCB)

Each thread is represented as a TCB struct containing its ID, name, state,
saved CPU context, stack memory, priority, and virtual runtime (vruntime).

### Context Switching

Uses the POSIX ucontext_t API (getcontext, makecontext, swapcontext)
to save and restore thread execution state without kernel involvement.

### Scheduling Policies

| Policy | Description |
|--------|-------------|
| Round Robin | Each thread gets equal time slices in order |
| Priority | Higher priority threads run first |
| CFS-inspired | Thread with least vruntime (CPU time used) runs next |

### Synchronization

- Mutex -- ensures only one thread accesses a critical section at a time
- Semaphore -- controls access to a pool of resources, enables thread signaling

---

## Demo Output

## Demo

![Thread Scheduler Visualizer](docs/screenshot.png)

🔗 **[Live Demo](https://userspace-thread-scheduler-cpp.vercel.app)**

---

## Tech Stack

- C++17
- POSIX ucontext API
- macOS / Linux compatible