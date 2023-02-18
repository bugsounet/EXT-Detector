#!/bin/bash
# +-----------------+
# | npm postinstall |
# +-----------------+

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

Installer_info "Minify Main code..."
node minify.js
Installer_success "Done"
echo

cd ..
# module name
Installer_module="EXT-Detector"

Installer_info "Rebuild MagicMirror..."
MagicMirror-rebuild 2>/dev/null || {
  Installer_error "Rebuild Failed"
  exit 255
}
Installer_success "Done"
echo

# the end...
Installer_warning "Support is now moved in a dedicated Server: https://forum.bugsounet.fr"
Installer_warning "@bugsounet"
echo
Installer_success "$Installer_module is now installed !"
