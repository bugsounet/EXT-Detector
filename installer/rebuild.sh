#!/bin/bash
# +---------+
# | Rebuild |
# +---------+

# get the installer directory
Installer_get_current_dir () {
  SOURCE="${BASH_SOURCE[0]}"
  while [ -h "$SOURCE" ]; do
    DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
    SOURCE="$(readlink "$SOURCE")"
    [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
  done
  echo "$( cd -P "$( dirname "$SOURCE" )" && pwd )"
}

Installer_dir="$(Installer_get_current_dir)"

# move to installler directory
cd "$Installer_dir"

source utils.sh

Installer_info "Welcome to EXT-Detector rebuild script"
Installer_warning "This script will erase current build of EXT-Detector and reinstall it"
Installer_error "Use this script only for the new version of Magic Mirror"
Installer_yesno "Do you want to continue ?" || exit 0

MMHOME="${HOME}/MagicMirror"
[ -d ${MMHOME}/modules/EXT-Detector ] || {
  MMHOME=
  for homedir in /usr/local /home/*
  do
    [ "${homedir}" == "/home/*" ] && continue
    [ -d ${homedir}/MagicMirror/modules/EXT-Detector ] && {
      MMHOME="${homedir}/MagicMirror"
      break
    }
  done
}

if [ "${MMHOME}" ]
then
  cd ${MMHOME}/modules/EXT-Detector
else
  cd ~/MagicMirror/modules/EXT-Detector
fi

echo
Installer_info "Deleting: package-lock.json node_modules" 
rm -rf package.json package-lock.json node_modules
Installer_success "Done."
echo
Installer_info "Upgrading EXT-Detector..."
git reset --hard HEAD
git checkout package.json
git pull
Installer_success "Done."
echo
Installer_info "Reinstalling EXT-Detector..."
npm install
