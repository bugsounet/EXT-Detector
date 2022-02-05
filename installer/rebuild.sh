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

Installer_info "Welcome to MMM-Detector rebuild script"
Installer_warning "This script will erase current build and reinstall it"
Installer_error "Use this script only for the new version of Magic Mirror or developer request"
Installer_yesno "Do you want to continue ?" || exit 0

MMHOME="${HOME}/MagicMirror"
[ -d ${MMHOME}/modules/MMM-Detector ] || {
  MMHOME=
  for homedir in /usr/local /home/*
  do
    [ "${homedir}" == "/home/*" ] && continue
    [ -d ${homedir}/MagicMirror/modules/MMM-Detector ] && {
      MMHOME="${homedir}/MagicMirror"
      break
    }
  done
}

if [ "${MMHOME}" ]
then
  cd ${MMHOME}/modules/MMM-Detector
else
  cd ~/MagicMirror/modules/MMM-Detector
fi

echo
Installer_info "Deleting: package-lock.json node_modules" 
rm -rf package.json package-lock.json node_modules
Installer_success "Done."
echo
Installer_info "Upgrading MMM-Detector..."
git reset --hard HEAD
git checkout package.json
git pull
Installer_success "Done."
echo
Installer_info "Reinstalling MMM-Detector..."
npm install
