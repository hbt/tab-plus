rm -rf google-chrome-tab-plus
svn checkout https://chrome-tab-plus.googlecode.com/svn/trunk/ google-chrome-tab-plus --username hassenbentanfous
cd google-chrome-tab-plus
svn export --force http://forums.svnrepository.com/svn/ubuntu/scripts/chrome/tab_plus/
svn add *
svn commit tab_plus -m "$1"
cd ../