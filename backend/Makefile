CXX = g++
CXXFLAGS = -std=c++17 -Wall -pthread -I/usr/local/include -I/opt/homebrew/include
LDFLAGS = -L/usr/local/lib -L/opt/homebrew/lib -L/opt/homebrew/lib/postgresql@14 -L/opt/homebrew/Cellar/libpq/17.4_1/lib
TARGET = transaction_server

# OS-specific settings
ifeq ($(OS),Windows_NT)
    TARGET := $(TARGET).exe
    LDLIBS = -lws2_32 -lpqxx -lpq
else
    LDLIBS = -lpqxx -lpq
endif

SRC = src/server.cpp src/database.cpp src/user.cpp src/auction.cpp
OBJ = $(SRC:.cpp=.o)

all: $(TARGET)

$(TARGET): $(OBJ)
	$(CXX) $(CXXFLAGS) -o $@ $^ $(LDLIBS) $(LDFLAGS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	rm -f $(OBJ) $(TARGET)

install-deps:
	sudo apt-get update && sudo apt-get install -y libpqxx-dev postgresql-client

.PHONY: all clean install-deps