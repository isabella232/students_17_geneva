#!/bin/bash

#set -x

if [[ "$#" -ne 1 ]]; then
    echo "Need an argument: <n> number of servers to start. Incremental
    addresses starting from 8000"
    exit 1
fi

N=$1

go build

trap "exit" INT TERM ERR
trap "kill 0" EXIT

for i in $(seq 1 $N); do
    echo "starting server $i ..."
    port=$((8000 + $i - 1))
    ./server "127.0.0.1:$port" &
done

wait
