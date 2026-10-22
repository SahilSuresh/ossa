#!/bin/sh
# q.sh ev 'expr' | q.sh get '/path?query'
if [ "$1" = "ev" ]; then curl -s -X POST --data-binary "$2" http://127.0.0.1:9360/ev; echo; else curl -s "http://127.0.0.1:9360$2"; echo; fi
