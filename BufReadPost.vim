vim9script

var ts_defs_path = expandcmd("~/Code/Projects/ts-defs/tags")

var taglist: list<string>
if &filetype == 'javascript'
  taglist = ['ecmascript', 'web']
elseif &filetype == 'css'
  taglist = ['css']
else
  finish
endif

for tagdir in taglist
  exe "setlocal tags+=" .. $"{ts_defs_path}/{tagdir}/tags"
endfor
