FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    pkg-config \
    libmysqlclient-dev \
    libssl-dev \
    git \
    wget \
    ca-certificates

WORKDIR /app
COPY . .

# Install Crow headers globally
RUN git clone https://github.com/CrowCpp/Crow.git /tmp/crow && \
    cp -r /tmp/crow/include/* /usr/local/include/

# Download standalone ASIO headers required by Crow
RUN wget -O /tmp/asio.tar.gz https://github.com/chriskohlhoff/asio/archive/refs/tags/asio-1-28-0.tar.gz && \
    mkdir -p /tmp/asio && tar -xzf /tmp/asio.tar.gz -C /tmp/asio --strip-components=1 && \
    cp -r /tmp/asio/asio/include/* /usr/local/include/

# Create symbolic link for MySQL headers
RUN ln -s /usr/include/mysql /usr/local/include/mysql

# Build the application
RUN mkdir -p build && cd build && cmake .. && make

EXPOSE 18080
CMD ["./build/library-api"]