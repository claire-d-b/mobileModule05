#!/bin/bash
set -e
# $HOME est limité à ~4.7G sur ce système ; sgoinfre a des To disponibles.
# Tout ce qui est volumineux (SDK Android, platform-tools, caches Gradle/npm)
# est donc installé sous sgoinfre, jamais directement dans $HOME.
SGOINFRE="$HOME/sgoinfre"
mkdir -p "$SGOINFRE"

# Sur ce filesystem NFS, un rm -rf interrompu (process encore ouvert) laisse
# des résidus .nfs* qui bloquent la suppression définitivement. On ne peut
# pas les rm, mais on peut les "mv" hors du chemin pour repartir proprement.
quarantaine_si_cassé() {
  # $1 = chemin du dossier, $2 = fichier attendu à l'intérieur pour valider l'install
  local dir="$1" marker="$2"
  if [ -d "$dir" ] && [ ! -e "$dir/$marker" ]; then
    echo "==> $dir semble cassé/incomplet (résidu), mise en quarantaine..."
    mv "$dir" "${dir}.zombie.$(date +%s)" 2>/dev/null || true
  fi
}

# ********* adb / platform-tools (déplacé dans sgoinfre) *********
quarantaine_si_cassé "$SGOINFRE/platform-tools" "adb"
if [ ! -f "$SGOINFRE/platform-tools/adb" ]; then
curl -L "https://dl.google.com/android/repository/platform-tools-latest-linux.zip" -o "$SGOINFRE/platform-tools.zip"
unzip "$SGOINFRE/platform-tools.zip" -d "$SGOINFRE"
rm "$SGOINFRE/platform-tools.zip"
fi
export PATH="$SGOINFRE/platform-tools:$PATH"
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

# ********* java 21 (requis par Gradle/Android — JDK 25 donne "class file major version 69" non supporté ; les URLs JDK 17 "latest"/"archive" gratuites sont mortes depuis 2024/2025) *********
for d in "$SGOINFRE"/jdk-21*; do
  [ -d "$d" ] && quarantaine_si_cassé "$d" "bin/java"
done
JDK21_DIR="$(ls -d "$SGOINFRE"/jdk-21* 2>/dev/null | grep -v '\.zombie\.' | head -1)"
if [ -z "$JDK21_DIR" ] || [ ! -x "$JDK21_DIR/bin/java" ]; then
wget -P "$SGOINFRE" https://download.oracle.com/java/21/latest/jdk-21_linux-x64_bin.tar.gz
tar -xzf "$SGOINFRE/jdk-21_linux-x64_bin.tar.gz" -C "$SGOINFRE"
rm "$SGOINFRE/jdk-21_linux-x64_bin.tar.gz"
JDK21_DIR="$(ls -d "$SGOINFRE"/jdk-21* 2>/dev/null | grep -v '\.zombie\.' | head -1)"
fi
export JAVA_HOME="$JDK21_DIR"
export PATH="$JAVA_HOME/bin:$PATH"
java -version

# ********* android sdk (déplacé dans sgoinfre — build-tools/platforms sont volumineux) *********
export ANDROID_HOME="$SGOINFRE/Android/sdk"
quarantaine_si_cassé "$ANDROID_HOME" "cmdline-tools/latest/bin/sdkmanager"
if [ ! -d "$ANDROID_HOME" ]; then
mkdir -p "$ANDROID_HOME"
curl -L "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip" -o "$SGOINFRE/cmdline-tools.zip"
unzip "$SGOINFRE/cmdline-tools.zip" -d "$ANDROID_HOME/cmdline-tools"
mv "$ANDROID_HOME/cmdline-tools/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest"
rm "$SGOINFRE/cmdline-tools.zip"
yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses
"$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" "platforms;android-34" "build-tools;34.0.0"
fi
if [ ! -f "$ANDROID_HOME/platform-tools/adb" ]; then
mkdir -p "$ANDROID_HOME/platform-tools"
ln -sf "$SGOINFRE/platform-tools/adb" "$ANDROID_HOME/platform-tools/adb"
fi
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

# ********* Postgres : compilation, initialisation, démarrage, rôle/DB — DANS CET ORDRE *********
PG_SRC_VERSION="17.2"
PG_PREFIX="$SGOINFRE/pgsql"
PG_DATA="$SGOINFRE/pgsql_data"
DB_ROLE="claire"
DB_NAME="advanced_diary_app"

# 1. compiler (une seule fois)
quarantaine_si_cassé "$PG_PREFIX" "bin/pg_ctl"
if [ ! -f "$PG_PREFIX/bin/pg_ctl" ]; then
echo "==> Compilation de PostgreSQL (peut prendre plusieurs minutes)..."
cd "$SGOINFRE"
curl -O "https://ftp.postgresql.org/pub/source/v${PG_SRC_VERSION}/postgresql-${PG_SRC_VERSION}.tar.gz"
tar -xzf "postgresql-${PG_SRC_VERSION}.tar.gz"
cd "postgresql-${PG_SRC_VERSION}"
./configure --prefix="$PG_PREFIX" --without-icu CFLAGS="-std=gnu17"
make -j"$(nproc)"
make install
cd ..
rm -rf "postgresql-${PG_SRC_VERSION}" "postgresql-${PG_SRC_VERSION}.tar.gz"
else
echo "==> PostgreSQL déjà compilé, on saute la compilation."
fi
export PATH="$PG_PREFIX/bin:$PATH"
psql --version

# 2. initialiser le cluster (une seule fois) — DOIT précéder le démarrage
if [ ! -s "$PG_DATA/PG_VERSION" ]; then
echo "==> Initialisation du cluster PostgreSQL..."
mkdir -p "$PG_DATA"
initdb -D "$PG_DATA" -U postgres
fi

# 3. démarrer le serveur seulement s'il ne tourne pas déjà
if ! pg_ctl -D "$PG_DATA" status > /dev/null 2>&1; then
echo "==> Démarrage de PostgreSQL..."
pg_ctl -D "$PG_DATA" -l "$PG_DATA/logfile.log" -o "-p 5432" start
sleep 1
else
echo "==> PostgreSQL tourne déjà."
fi
pg_ctl -D "$PG_DATA" status

# 4. créer le rôle applicatif s'il n'existe pas
if ! psql -h localhost -p 5432 -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_ROLE'" | grep -q 1; then
echo "==> Création du rôle $DB_ROLE..."
createuser -h localhost -p 5432 -U postgres --superuser "$DB_ROLE"
fi

# 5. créer la base si elle n'existe pas
if ! psql -h localhost -p 5432 -U postgres -lqt | cut -d '|' -f 1 | grep -qw "$DB_NAME"; then
echo "==> Création de la base $DB_NAME..."
createdb -h localhost -p 5432 -U postgres -O "$DB_ROLE" "$DB_NAME"
fi

# ********* install ngrok (petit binaire, reste dans ~/.local/bin) *********
if [ ! -f "$HOME/.local/bin/ngrok" ]; then
echo "==> Installation de ngrok..."
cd "$HOME"
curl -O https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-v3-stable-linux-amd64.tgz
mkdir -p "$HOME/.local/bin"
mv ngrok "$HOME/.local/bin/"
rm -f ngrok-v3-stable-linux-amd64.tgz
fi

# ********* caches Gradle / npm / génériques redirigés vers sgoinfre *********
mkdir -p "$SGOINFRE/.gradle" "$SGOINFRE/.npm-cache" "$SGOINFRE/.cache"
export GRADLE_USER_HOME="$SGOINFRE/.gradle"
export npm_config_cache="$SGOINFRE/.npm-cache"
export XDG_CACHE_HOME="$SGOINFRE/.cache"
npm config set cache "$SGOINFRE/.npm-cache"

if [ -d "$HOME/.gradle" ]; then
echo "==> Nettoyage de l'ancien cache Gradle dans \$HOME (déjà redirigé vers sgoinfre)..."
rm -rf "$HOME/.gradle" 2>/dev/null || mv "$HOME/.gradle" "$HOME/.gradle.zombie.$(date +%s)" 2>/dev/null || true
fi
if [ -d "$HOME/.npm" ]; then
echo "==> Nettoyage de l'ancien cache npm dans \$HOME (déjà redirigé vers sgoinfre)..."
rm -rf "$HOME/.npm" 2>/dev/null || mv "$HOME/.npm" "$HOME/.npm.zombie.$(date +%s)" 2>/dev/null || true
fi

# ********* rendre PATH/JAVA_HOME/caches persistants dans tous les futurs terminaux *********
BASHRC="$HOME/.bashrc"
MARKER_START="# --- mobileModule05 env (généré par start.sh) ---"
MARKER_END="# --- fin mobileModule05 env ---"

if [ -f "$BASHRC" ] && grep -qF "$MARKER_START" "$BASHRC"; then
  echo "==> Suppression de l'ancien bloc d'environnement dans $BASHRC..."
  sed -i "/$(printf '%s' "$MARKER_START" | sed 's/[.[\*^$]/\\&/g')/,/$(printf '%s' "$MARKER_END" | sed 's/[.[\*^$]/\\&/g')/d" "$BASHRC"
fi

echo "==> Écriture du bloc d'environnement à jour dans $BASHRC..."
cat >> "$BASHRC" << EOF

$MARKER_START
export SGOINFRE="\$HOME/sgoinfre"
export PATH="\$SGOINFRE/platform-tools:\$PATH"
export JAVA_HOME="$JAVA_HOME"
export PATH="\$JAVA_HOME/bin:\$PATH"
export ANDROID_HOME="\$SGOINFRE/Android/sdk"
export PATH="\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools:\$PATH"
export PATH="$PG_PREFIX/bin:\$PATH"
export PATH="\$HOME/.local/bin:\$PATH"
export GRADLE_USER_HOME="\$SGOINFRE/.gradle"
export npm_config_cache="\$SGOINFRE/.npm-cache"
export XDG_CACHE_HOME="\$SGOINFRE/.cache"
$MARKER_END
EOF

echo "==> Installation terminée."
echo "==> Base '$DB_NAME' et rôle '$DB_ROLE' prêts."
echo "==> Fais 'source ~/.bashrc' dans les terminaux déjà ouverts."
echo "==> Tout nouveau terminal chargera automatiquement adb/java/psql/ngrok/gradle-cache sans action supplémentaire."