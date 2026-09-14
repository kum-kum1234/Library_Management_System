FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libmysqlclient-dev \
    libssl-dev \
    git \
    ca-certificates

WORKDIR /app
COPY . .

# Download and install Crow headers globally
RUN git clone https://github.com/CrowCpp/Crow.git /tmp/crow && \
    cp -r /tmp/crow/include/* /usr/local/include/

RUN mkdir -p build && cd build && cmake .. && make

EXPOSE 18080
CMD ["./build/library-api"]