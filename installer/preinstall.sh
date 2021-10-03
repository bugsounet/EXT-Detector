#!/bin/bash
# +----------------+
# | npm preinstall |
# +----------------+

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
CurrentNpmVer="$(npm -v)"
MinRequireNpmVer="6.14.15"
MaxRequireNpmVer="7.0.0"
CurrentNodeVer="$(node -v)"
RequireNodeVer="v12.0.0"

# module name
Installer_module="MMM-Detector"

# check version
Installer_version="$(cat ../package.json | grep version | cut -c14-30 2>/dev/null)"

# Let's start !
Installer_info "Welcome to $Installer_module $Installer_version"
echo

# delete package-lock.json (force)
rm -f ../package-lock.json

# Check not run as root
if [ "$EUID" -eq 0 ]; then
  Installer_error "npm install must not be used as root"
  exit 1
fi

Installer_info "NPM Version testing:"
 if [ "$(printf '%s\n' "$MinRequireNpmVer" "$CurrentNpmVer" | sort -V | head -n1)" = "$MinRequireNpmVer" ]; then 
        Installer_warning "Require: >= ${MinRequireNpmVer} < ${MaxRequireNpmVer}"
        if [[ "$(printf '%s\n' "$MaxRequireNpmVer" "$CurrentNpmVer" | sort -V | head -n1)" < "$MaxRequireNpmVer" ]]; then
          Installer_sucess "Current: ${CurrentNpmVer} ✓"
        else
          Installer_error "Current: ${CurrentNpmVer} 𐄂"
          Installer_error "Failed: incorrect version!"
          echo
          exit 255
        fi
 else
        Installer_warning "Require: ${RequireNpmVer}"
        Installer_error "Current: ${CurrentNpmVer} 𐄂"
        Installer_error "Failed: incorrect version!"
        exit 255
 fi
echo
Installer_info "NODE Version testing:"
 if [ "$(printf '%s\n' "$RequireNodeVer" "$CurrentNodeVer" | sort -V | head -n1)" = "$RequireNodeVer" ]; then 
        Installer_warning "Require: ${RequireNodeVer}"
        Installer_sucess "Current: ${CurrentNodeVer} ✓"
 else
        Installer_warning "Require: ${RequireNodeVer}"
        Installer_error "Current: ${CurrentNodeVer} 𐄂"
        Installer_error "Failed: incorrect version!"
        exit 255
 fi
echo
echo "Passed: perfect!"
echo

Installer_info "Installing all npm libraries..."
