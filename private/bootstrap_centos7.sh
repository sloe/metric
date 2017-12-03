
USER_BASE=~/.local/bin
ROOT=/srv
APP_URL=https://github.com/sloe/metric.git
WEB2PY_GITURL=https://github.com/web2py/web2py.git
WEB2PY_BRANCH=master

APPNAME=metric
APPBRANCH=metric
WEB2PY_DIR=$ROOT/web2py
APP_PARENT_DIR=$WEB2PY_DIR/applications
APP_DIR=$APP_PARENT_DIR/$APPNAME
APPCONFIG_LEAFNAME=appconfig.ini
APPCONFIG_DEST=$APP_DIR/private/$APPCONFIG_LEAFNAME
GUNICORN_RUN_DIR=/run/gunicorn

yum install -y git

if [ ! -d $WEB2PY_DIR ]; then
  if [ ! -d $ROOT ]; then
    mkdir -p $ROOT
  fi
  cd $ROOT
  git clone $WEB2PY_GITURL
  cd $WEB2PY_DIR
  git checkout -b $WEB2PY_BRANCH
fi

cd $WEB2PY_DIR
git reset --hard
git checkout $WEB2PY_BRANCH
git pull --ff-only origin $WEB2PY_BRANCH
git submodule update --init --recursive
git clean -df

\cp -f handlers/wsgihandler.py .

if [ ! -d $APP_DIR ]; then
  cd $APP_PARENT_DIR
  git clone $APP_URL
  cd $APP_DIR
  git checkout -b $APPBRANCH
fi

cd $APP_DIR

git reset --hard
git checkout $APPBRANCH
git pull --ff-only origin $APPBRANCH
git clean -df

id -g mtgunic &>/dev/null || groupadd --gid=2000 mtgunic
id -u mtgunic &>/dev/null || useradd --create-home --gid=2000 --shell=/bin/false --uid=2000 mtgunic

cd $WEB2PY_DIR

\cp -f applications/metric/private/routes.py .

for dir in deposit logs
do
  if [ ! -d $dir ] ; then
    mkdir $dir
    chgrp mtgunic $dir
    chmod g+rwx $dir
  fi
done

cd $APP_DIR

for dir in databases errors sessions uploads
do
  if [ ! -d $dir ] ; then
    mkdir $dir
    chgrp mtgunic $dir
    chmod g+rwx $dir
  fi
done

export PIPENV_VENV_IN_PROJECT=1
pip install pipenv
PATH=$APP_DIR/.local/bin:$PATH
pipenv --update
pipenv install
PIPENV_BIN=`pipenv --venv`/bin

echo Pipenv path to venv is $PIPENV_BIN

\rm -rf $APP_DIR/compiled/*

cd $WEB2PY_DIR

$PIPENV_BIN/python web2py.py -S $APPNAME -R applications/$APPNAME/private/compile.py

cd $APP_DIR

sed -e "s%@PIPENV_BIN@%$PIPENV_BIN%g" -e "s%@WEB2PY_DIR@%$WEB2PY_DIR%g" private/systemd_system_gunicorn.service > /etc/systemd/system/gunicorn.service
\cp -f private/systemd_system_gunicorn.socket /etc/systemd/system/gunicorn.socket
\cp -f private/tmpfiles_d_gunicorn.conf /etc/tmpfiles.d/gunicorn.conf

NGINX_SSL_DIR=/etc/nginx/ssl

\cp -f private/etc_nginx_conf_d_web2py.conf /etc/nginx/conf.d/web2py.conf

if [ ! -f $APPCONFIG_DEST ] ; then
  \cp -f ~/$APPCONFIG_LEAFNAME $APPCONFIG_DEST
fi

if [ ! -d $NGINX_SSL_DIR ] ; then
  mkdir -p $NGINX_SSL_DIR
  cd $NGINX_SSL_DIR

  openssl genrsa 1024 > web2py.key && chmod 400 web2py.key
  openssl req -new -x509 -nodes -sha1 -days 1780 -key web2py.key > web2py.crt
  openssl x509 -noout -fingerprint -text < web2py.crt > web2py.info
fi

systemctl enable gunicorn.socket
systemctl start gunicorn.socket

systemctl enable gunicorn.service
systemctl reload gunicorn.service

