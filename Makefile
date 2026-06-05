# Compiler and flags
CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -g

# Folders
SRC_DIR = src
INC_DIR = include
TEST_DIR = tests
BUILD_DIR = build

# Source files
SRCS = $(SRC_DIR)/thread.cpp \
       $(SRC_DIR)/scheduler.cpp \
       $(SRC_DIR)/sync.cpp

# Test file
TEST_SRC = $(TEST_DIR)/main.cpp

# Output binary
TARGET = scheduler_demo

# Build target
all:
	mkdir -p $(BUILD_DIR)
	$(CXX) $(CXXFLAGS) -I$(INC_DIR) $(SRCS) $(TEST_SRC) -o $(BUILD_DIR)/$(TARGET)

# Run the demo
run: all
	./$(BUILD_DIR)/$(TARGET)

# Clean build artifacts
clean:
	rm -rf $(BUILD_DIR)