#!/bin/sh

CONFIG=/boot/config.txt

ASK_TO_REBOOT=0

get_serial_hw() {
  if grep -q -E "^enable_uart=1" $CONFIG ; then
    echo 0
  elif grep -q -E "^enable_uart=0" $CONFIG ; then
    echo 1
  elif [ -e /dev/serial0 ] ; then
    echo 0
  else
    echo 1
  fi
}

set_config_var() {
  lua - "$1" "$2" "$3" <<EOF > "$3.bak"
local key=assert(arg[1])
local value=assert(arg[2])
local fn=assert(arg[3])
local file=assert(io.open(fn))
local made_change=false
for line in file:lines() do
  if line:match("^#?%s*"..key.."=.*$") then
    line=key.."="..value
    made_change=true
  end
  print(line)
end

if not made_change then
  print(key.."="..value)
end
EOF
mv "$3.bak" "$3"
}

if [ $(get_serial_hw) -eq 1 ]; then
  set_config_var enable_uart 1 $CONFIG
  ASK_TO_REBOOT=1
fi

if ! grep -q -E "^dtoverlay=pi3-miniuart-bt" $CONFIG; then
  printf "dtoverlay=pi3-miniuart-bt\n" >> $CONFIG
  ASK_TO_REBOOT = 1
fi

if ! grep -q -E dust config.json; then
  echo \{ \"parameter\": \"dust\", \"model\": \"$1\", \"options\": \{ \"device\": \"$2\" \} \} | node config.js
fi

if [ ! -d "db" ]; then
  mkdir db
fi

if [ $ASK_TO_REBOOT -eq 1 ]; then
  whiptail --yesno "Would you like to reboot now?" 20 60 2
  if [ $? -eq 0 ]; then # yes
    sync
    reboot
  fi
fi

exit 0
