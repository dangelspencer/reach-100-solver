#!/bin/bash

source .env

URL="$SLACK_URL"
USERNAME='Reach 100 Solver'
TO="$USER"
MESSAGE="$1"
EMOJI="robot_face"
PAYLOAD="payload={\"channel\": \"${TO//\"/\\\"}\", \"username\": \"${USERNAME//\"/\\\"}\", \"text\": \"$MESSAGE\", \"icon_emoji\": \"${EMOJI}\"}"

curl -m 5 --data-urlencode "${PAYLOAD}" $URL -A 'zabbix-slack-alertscript / https://github.com/ericoc/zabbix-slack-alertscript'