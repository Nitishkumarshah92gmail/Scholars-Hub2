CXX = g++
CXXFLAGS = -O3 -std=c++17 -Wall -Wextra
LDFLAGS = -lpthread

TARGET = feed_server
SOURCES = FeedServiceServer.cpp

all: $(TARGET)

$(TARGET): $(SOURCES)
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(SOURCES) $(LDFLAGS)

clean:
	rm -f $(TARGET) gen-cpp/*.o

.PHONY: all clean
