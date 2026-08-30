#!/bin/sh

# ********* adb *********
if [ ! -f "$HOME/platform-tools/adb" ]; then
  curl -L "https://dl.google.com/android/repository/platform-tools-latest-linux.zip" -o "$HOME/platform-tools.zip"
  unzip "$HOME/platform-tools.zip" -d "$HOME"
  rm "$HOME/platform-tools.zip"
fi
export PATH="$HOME/platform-tools:$PATH"
adb version

# ********* nvm *********
export NVM_DIR="$HOME/.var/app/com.visualstudio.code/config/nvm"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
fi
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# ********* node *********
if ! command -v node > /dev/null 2>&1; then
  nvm install --lts
fi
NODE_BIN="$(dirname "$(command -v node)")"
export PATH="$NODE_BIN:$PATH"
node -v
npm -v

# ********* java *********
if [ ! -d "$HOME/sgoinfre/jdk-25.0.3" ]; then
  wget -P "$HOME/sgoinfre" https://download.oracle.com/java/25/latest/jdk-25_linux-x64_bin.tar.gz
  tar -xzf "$HOME/sgoinfre/jdk-25_linux-x64_bin.tar.gz" -C "$HOME/sgoinfre"
  rm "$HOME/sgoinfre/jdk-25_linux-x64_bin.tar.gz"
fi
export JAVA_HOME="$(ls -d "$HOME/sgoinfre"/jdk-25* | head -1)"
export PATH="$JAVA_HOME/bin:$PATH"
java -version

# ********* android sdk *********
export ANDROID_HOME="$HOME/Android/sdk"
if [ ! -d "$ANDROID_HOME" ]; then
  mkdir -p "$ANDROID_HOME"
  curl -L "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip" -o "$HOME/cmdline-tools.zip"
  unzip "$HOME/cmdline-tools.zip" -d "$ANDROID_HOME/cmdline-tools"
  mv "$ANDROID_HOME/cmdline-tools/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest"
  rm "$HOME/cmdline-tools.zip"
  yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses
  "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" "platforms;android-34" "build-tools;34.0.0"
fi
if [ ! -f "$ANDROID_HOME/platform-tools/adb" ]; then
  mkdir -p "$ANDROID_HOME/platform-tools"
  ln -sf "$HOME/platform-tools/adb" "$ANDROID_HOME/platform-tools/adb"
fi
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

# ********* ngrok *********
# if [ ! -f "$HOME/sgoinfre/ngrok/ngrok" ]; then
# mkdir -p "$HOME/sgoinfre/ngrok"
# NGROK_ARCH="$(uname -m)"
# case "$NGROK_ARCH" in
#   x86_64) NGROK_URL="https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz" ;;
#   aarch64|arm64) NGROK_URL="https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-arm64.tgz" ;;
#   armv7l) NGROK_URL="https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-arm.tgz" ;;
#   *) echo "Unsupported architecture for ngrok: $NGROK_ARCH"; exit 1 ;;
# esac
# curl -L "$NGROK_URL" -o "$HOME/sgoinfre/ngrok.tgz"
# tar -xzf "$HOME/sgoinfre/ngrok.tgz" -C "$HOME/sgoinfre/ngrok"
# rm "$HOME/sgoinfre/ngrok.tgz"
# fi
# export PATH="$HOME/sgoinfre/ngrok:$PATH"
# ngrok version
# npx ngrok authtoken TON_TOKEN_ICI
export PATH="$HOME/sgoinfre/ngrok:$PATH"
ngrok version
set -a
source .env
set +a

ngrok config add-authtoken "$NGROK_AUTHTOKEN"

# ********* npm cache *********
npm config set cache "$HOME/sgoinfre/.npm-cache"

cd "$HOME/sgoinfre/mobileModule05"