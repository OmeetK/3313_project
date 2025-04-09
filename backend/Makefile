CXX = g++
CXXFLAGS = -std=c++17 -Wall -pthread -Wno-deprecated-declarations -I./libs/cpp-jwt/include -I./libs

# OS-specific settings
ifeq ($(OS),Windows_NT)
    TARGET = transaction_server.exe
    LDLIBS = -lws2_32 -lpqxx -lpq -lcrypto -lssl
else
    TARGET = transaction_server
    UNAME_S := $(shell uname -s)
    ifeq ($(UNAME_S),Darwin)
        # macOS settings
        CXXFLAGS += -I/usr/local/include -I/opt/homebrew/include
        LDFLAGS = -L/usr/local/lib -L/opt/homebrew/lib -L/opt/homebrew/lib/postgresql@14 -L/opt/homebrew/Cellar/libpq/17.4_1/lib
    else
        # Linux settings
        CXXFLAGS += -I/usr/include
        LDFLAGS = -L/usr/lib
    endif
    LDLIBS = -lpqxx -lpq -lcrypto -lssl
endif

SRC = src/server.cpp src/database.cpp src/user.cpp src/auction.cpp src/sell.cpp
OBJ = $(SRC:.cpp=.o)

all: $(TARGET)

$(TARGET): $(OBJ)
	$(CXX) $(CXXFLAGS) -o $@ $^ $(LDLIBS) $(LDFLAGS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	rm -f $(OBJ) $(TARGET)

install-deps-debian:
	sudo apt-get update && sudo apt-get install -y libpqxx-dev postgresql-client

install-deps-mac:
	brew update && brew install libpqxx postgresql@14

.PHONY: all clean install-deps-debian install-deps-mac