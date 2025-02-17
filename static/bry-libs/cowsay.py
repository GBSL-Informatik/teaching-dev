# from https://pypi.org/project/cowsay/

from __future__ import annotations
from typing import Callable
import re
CHARS_RAW = {

    "beavis": r'''
     \
      \
       \
             _------~~-,
          ,'            ,
          /               \\
         /                :
        |                  '
        |                  |
        |                  |
         |   _--           |
         _| =-.     .-.   ||
         o|/o/       _.   |
         /  ~          \\ |
       (____\@)  ___~    |
          |_===~~~.`    |
       _______.--~     |
       \\________       |
                \\      |
              __/-___-- -__
             /            _ \\
''',

    "cheese": r'''
\
 \
  \
   \
     /     \_/         |
    |                 ||
    |                 ||
   |    ###\  /###   | |
   |     0  \/  0    | |
  /|                 | |
 / |        <        |\ \
| /|                 | | |
| |     \_______/   |  | |
| |                 | / /
/||                 /|||
   ----------------|
        | |    | |
        ***    ***
       /___\  /___\
''',

    "daemon": r'''
        \
         \
          \
           \
            /- _  `-/  '
           (/\/ \ \   /\
           / /   | `    \
           O O   ) /    |
           `-^--'`<     '
          (_.)  _  )   /
           `.___/`    /
             `-----' /
<----.     __ / __   \
<----|====O)))==) \) /====
<----'    `--' `.__,' \
             |        |
              \       /
        ______( (_  / \______
      ,'  ,-----'   |        \
      `--{__________)        \/
''',

    "cow": r'''
\
 \
   ^__^
   (oo)\_______
   (__)\       )\/\
       ||----w |
       ||     ||
''',

    "dragon": r'''
  \
   \
    \
     \
                           / \\  //\\
            |\\___/|      /   \\//  \\\\
            /0  0  \\__  /    //  | \\ \\
           /     /  \\/_/    //   |  \\  \\
           \@_^_\@'/   \\/_   //    |   \\   \\
           //_^_/     \\/_ //     |    \\    \\
        ( //) |        \\///      |     \\     \\
      ( / /) _|_ /   )  //       |      \\     _\\
    ( // /) '/,_ _ _/  ( ; -.    |    _ _\\.-~        .-~~~^-.
  (( / / )) ,-{        _      `-.|.-~-.           .~         `.
 (( // / ))  '/\\      /                 ~-. _ .-~      .-~^-.  \\
 (( /// ))      `.   {            }                   /      \\  \\
  (( / ))     .----~-.\\        \\-'                 .~         \\  `. \\^-.
             ///.----..>        \\             _ -~             `.  ^-`  ^-_
               ///-._ _ _ _ _ _ _}^ - - - - ~                     ~-- ,.-~
                                                                  /.-~
''',

    "ghostbusters": r'''
        \
         \
          \
           \
                       __---__
                    _-       /--______
               __--( /     \ )XXXXXXXXXXX\v.
             .-XXX(   O   O  )XXXXXXXXXXXXXXX-
            /XXX(       U     )        XXXXXXX\
          /XXXXX(              )--_  XXXXXXXXXXX\
         /XXXXX/ (      O     )   XXXXXX   \XXXXX\
         XXXXX/   /            XXXXXX   \__ \XXXXX
         XXXXXX__/          XXXXXX         \__---->
 ---___  XXX__/          XXXXXX      \__         /
   \-  --__/   ___/\  XXXXXX            /  ___--/=
    \-\    ___/    XXXXXX              '--- XXXXXX
       \-\/XXX\ XXXXXX                      /XXXXX
         \XXXXXXXXX   \                    /XXXXX/
          \XXXXXX      >                 _/XXXXX/
            \XXXXX--__/              __-- XXXX/
             -XXXXXXXX---------------  XXXXXX-
                \XXXXXXXXXXXXXXXXXXXXXXXXXX/
                  ""VXXXXXXXXXXXXXXXXXXV""
''',


    "kitty": r'''
   \
    \
     \
      \

       ("`-'  '-/") .___..--' ' "`-._
        ` *_ *  )    `-.   (      ) .`-.__. `)
         (_Y_.) ' ._   )   `._` ;  `` -. .-'
      _.. `--'_..-_/   /--' _ .' ,4
     ( i l ),-''  ( l i),'  ( ( ! .-'
''',


    "meow": r"""
\
 \
  \
   \
                  _ ___.--'''`--''//-,-_--_.
      \\`"' ` || \\\\ \\ \\\\/ / // / ,-\\\\`,_
     /'`  \\ \\ || Y  | \\|/ / // / - |__ `-,
    /\@"\\  ` \\ `\\ |  | ||/ // | \\/  \\  `-._`-,_.,
   /  _.-. `.-\\,___/\\ _/|_/_\\_\\/|_/ |     `-._._)
   `-'``/  /  |  // \\__/\\__  /  \\__/ \\
        `-'  /-\\/  | -|   \\__ \\   |-' |
          __/\\ / _/ \\/ __,-'   ) ,' _|'
         (((__/(((_.' ((___..-'((__,'
""",

    "milk": r'''
\
 \
  \
   \
       ____________
       |__________|
      /           /\
     /           /  \
    /___________/___/|
    |          |     |
    |  ==\ /== |     |
    |   O   O  | \ \ |
    |     <    |  \ \|
   /|          |   \ \
  / |  \_____/ |   / /
 / /|          |  / /|
/||\|          | /||\/
    -------------|
        | |    | |
       <__/    \__>
''',

    "stegosaurus": r'''
      \
       \
        \
         \
                            .       .
                           / `.   .' \
                   .---.  <    > <    >  .---.
                   |    \  \ - ~ ~ - /  /    |
       _____        ~-..-~             ~-..-~
      |     |   \~~~\.'                    `./~~~/
     ---------   \__/                        \__/
    .'  O    \     /               /       \  "
   (_____,    `._.'               |         }  \/~~~/
    `----.          /       }     |        /    \__/
          `-.      |       /      |       /      `. ,~~|
              ~-.__|      /_ - ~ ^|      /- _      `..-'   f:  f:
                   |     /        |     /     ~-.     `-. _|| _||_
                   |_____|        |_____|         ~ - . _ _ _ _ __>

''',

    "stimpy": r'''
 \
  \
   \
    \
        .    _  .
       |\_|/__/|
       / / \/ \  \
      /__|O||O|__ \
     |/_ \_/\_/ _\ |
     | | (____) | ||
     \/\___/\__/  //
     (_/         ||
      |          ||
      |          ||\
       \        //_/
        \______//
       __ || __||
      (____(____)
''',

    "turkey": r'''
        \
         \
          \
           \
                                             ,+*^^*+___+++_
                                       ,*^^^^              )
                                    _+*                     ^**+_
                                  +^       _ _++*+_+++_,         )
              _+^^*+_    (     ,+*^ ^          \\+_        )
             {       )  (    ,(    ,_+--+--,      ^)      ^\\
            { (\@)    } f   ,(  ,+-^ __*_*_  ^^\\_   ^\\       )
           {:;-/    (_+*-+^^^^^+*+*<_ _++_)_    )    )      /
          ( /  (    (        ,___    ^*+_+* )   <    <      \\
           U _/     )    *--<  ) ^\\-----++__)   )    )       )
            (      )  _(^)^^))  )  )\\^^^^^))^*+/    /       /
          (      /  (_))_^)) )  )  ))^^^^^))^^^)__/     +^^
         (     ,/    (^))^))  )  ) ))^^^^^^^))^^)       _)
          *+__+*       (_))^)  ) ) ))^^^^^^))^^^^^)____*^
          \\             \\_)^)_)) ))^^^^^^^^^^))^^^^)
           (_             ^\\__^^^^^^^^^^^^))^^^^^^^)
             ^\\___            ^\\__^^^^^^))^^^^^^^^)\\\\
                  ^^^^^\\uuu/^^\\uuu/^^^^\\^\\^\\^\\^\\^\\^\\^\\
                     ___) >____) >___   ^\\_\\_\\_\\_\\_\\_\\)
                    ^^^//\\\\_^^//\\\\_^       ^(\\_\\_\\_\\)
                     ^^^ ^^ ^^^ ^
''',

    "turtle": r'''
  \
   \
    \
     \
                                ___-------___
                            _-~~             ~~-_
                         _-~                    /~-_
       /^\__/^\         /~  \                   /    \
     /|  O|| O|        /      \_______________/        \
    | |___||__|      /       /                \          \
    |          \    /      /                    \          \
    |   (_______) /______/                        \_________ \
    |         / /         \                      /            \
     \         \^\\         \                  /               \     /
       \         ||           \______________/      _-_       //\__//
         \       ||------_-~~-_ ------------- \ --/~   ~\    || __/
           ~-----||====/~     |==================|       |/~~~~~
            (_(__/  ./     /                    \_\      \.
                   (_(___/                         \_____)_)
''',

    "tux": r'''
     \
      \
       \
        .--.
       |o_o |
       |:_/ |
      //   \ \
     (|     | )
    /'\_   _/`\
    \___)=(___/
''',

    "pig": r'''
\
 \
  \
   \
             ,.
            (_|,.
            ,' /, )_______   _
        __j o``-'        `.'-)'
        (")                 \'
        `-j                |
          `-._(           /
             |_\  |--^.  /
            /_]'|_| /_)_/
                /_]'  /_]'
''',

    "trex": r'''
       \
        \
         \
          \
             .-=-==--==--.
       ..-=="  ,'o`)      `.
     ,'         `"'         \
    :  (                     `.__...._
    |                  )    /         `-=-.
    :       ,vv.-._   /    /               `---==-._
     \/\/\/VV ^ d88`;'    /                         `.
         ``  ^/d88P!'    /             ,              `._
            ^/    !'   ,.      ,      /                  "-,,__,,--'""""-.
           ^/    !'  ,'  \ . .(      (         _           )  ) ) ) ))_,-.\
          ^(__ ,!',"'   ;:+.:%:a.     \:.. . ,'          )  )  ) ) ,"'    '
          ',,,'','     /o:::":%:%a.    \:.:.:         .    )  ) _,'
           """'       ;':::'' `+%%%a._  \%:%|         ;.). _,-""
                  ,-='_.-'      ``:%::)  )%:|        /:._,"
                 (/(/"           ," ,'_,'%%%:       (_,'
                                (  (//(`.___;        \
                                 \     \    `         `
                                  `.    `.   `.        :
                                    \. . .\    : . . . :
                                     \. . .:    `.. . .:
                                      `..:.:\     \:...\
                                       ;:.:.;      ::...:
                                       ):%::       :::::;
                                   __,::%:(        :::::
                                ,;:%%%%%%%:        ;:%::
                                  ;,--""-.`\  ,=--':%:%:\
                                 /"       "| /-".:%%%%%%%\
                                                 ;,-"'`)%%)
                                                /"      "|
''',

    "miki": r'''
\
 \                  &************************&
  \             &******************************&
   \          &**********************************&
            &**************************************&
          &*****************************************&
         &*******************************************&
        &*********************************************&
       &***********************************************&
      &************************************************&
      &***#########********#########*******************&
      &*##       ##########          ##################&
      &*##   O   ##@**####   O       ##***************&
      &***#########@*******#########*****************&
      &***********@*********************************&
      &**********@*********************************&
      &*********@*********************************&
      &********@@*********************************&
       &*******@@@@@@****************************&
        &**************************************&
          &**************************************&
           &******@@@@@@@@@@@@*********************&
             &*************************************&
               &************************************&
                     &*******************************&
                       &*****************************&
''',

    "fox": r'''
 \
  \
   \
    |\_/|,,_____,~~`
    (.".)~~     )`~}}
     \o/\ /---~\\ ~}}
       _//    _// ~}
''',

    "octopus": r'''
     \
      \
       \
                        . . .
                      .   ^   .
                     .  ^ ^ ^  .
                     .  ^ ^ ^  .
                      .   ^    .
                        . . .
          _ _ _ _ _ _ _|     |_ _ _ _ _ _
         /  _ _ _ _ _ _| o|o |_ _ _ _ _ _ \
        / /  _ _ _  _ _|  |  |_ _ _ _    \ \
       / /  /  _ _ _ / /| |\ \ _ _ _  \   \ \
      / /  /  /     / / | | \ \     \  \   \ \
     / /  /  /     / /  | |  \ \     \  \   \ \
    /_/  /  /     / /   | |   \ \     \  \   \_\
     |  /__/     /_/    |_|    \_\     \__\   |
          |      /       |       \       |
''',

}

class CowsayError(LookupError):
    pass

CHARS: dict[str, str] = dict(sorted(CHARS_RAW.items()))
char_names: list[str] = list(CHARS.keys())

def wrap_lines(lines: list, max_width: int = 49) -> list:

    new_lines = []
    for line in lines:
        for line_part in [
            line[i: i+max_width] for i in range(0, len(line), max_width)
        ]:
            new_lines.append(line_part)
    return new_lines


def generate_bubble(text: str) -> list:

    lines = [line.strip() for line in text.split('\n')]
    lines = wrap_lines([line for line in lines if line])
    text_width = max([len(line) for line in lines])

    output = ["  " + "_" * text_width]
    if len(lines) > 1:
        output.append(" /" + " " * text_width + "\\")
    for line in lines:
        output.append("| " + line + " " * (text_width - len(line) + 1) + "|")
    if len(lines) > 1:
        output.append(" \\" + " " * text_width + "/")
    output.append("  " + "=" * text_width)

    return output


def generate_char(char_lines: str, text_width: int) -> list:

    output = []
    char_lines = char_lines.split('\n')
    char_lines = [i for i in char_lines if len(i) != 0]
    for line in char_lines:
        output.append(' ' * text_width + line)
    return output


def draw(text: str, char_lines: str, to_console: bool = True) -> None | str:

    if len(re.sub(r'\s', '', text)) == 0:
        raise CowsayError('Pass something meaningful to cowsay')

    output = generate_bubble(text)
    text_width = max([len(line) for line in output]) - 4  # 4 is the frame
    output += generate_char(char_lines, text_width)
    if to_console:
        for line in output:
            print(line)
    else:
        return '\n'.join(output)


def get_output_string(char: str, text: str) -> str:

    if char in CHARS:
        return draw(text, CHARS[char], to_console=False)
    else:
        raise CowsayError(f'Available Characters: {char_names}')


char_funcs: dict[str, Callable] = {}

for ch_name, ch_lines in CHARS.items():

    def func(text: str, char_lines=ch_lines):
        draw(str(text), char_lines)

    func.__name__ = ch_name
    globals()[ch_name] = func
    char_funcs[ch_name] = func