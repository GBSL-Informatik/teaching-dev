'''
Author: Balthasar Hofer
'''

from browser import document # type: ignore
from config import Config # type: ignore

class Cell():
    col: int
    row: int
    ctx = None
    grid = None
    init_draw = False
    def __init__(self, grid, col: int, row: int, color: str = ''):
        self.col = col
        self.row = row
        self.grid = grid
        self.init_draw = False
        self._text_scale = 0.8
        self._text = ''
        self._text_color = 'black'
        try:
            canvas = document[Config.CANVAS_ID]
            self.ctx = canvas.getContext('2d')
        except:
            pass
        self._color = color
        
    def get(self, offset_x: int, offset_y: int):
        y = (self.row + offset_y) % len(self.grid) # type: ignore
        x = (self.col + offset_x) % len(self.grid[y]) # type: ignore
        return self.grid[y][x] # type: ignore

    @property
    def text(self):
        return self._text

    @text.setter
    def text(self, text: str):
        if self._text == text:
            return
        self._text = text
        self.draw()


    @property
    def text_color(self):
        return self._text_color

    @text_color.setter
    def text_color(self, color: str):
        if self._text_color == color:
            return
        self._text_color = color
        self.draw()

    @property
    def text_scale(self):
        return self._text_scale

    @text_scale.setter
    def text_scale(self, scale: float):
        if self._text_scale == scale:
            return
        self._text_scale = scale
        self.draw()

    @property
    def color(self):
        return self._color or 'rgba(0,0,0,0)'

    @color.setter
    def color(self, color: str):
        if color == '':
            color = 'rgba(0,0,0,0)'

        if self._color == color and self.init_draw:
            return
        self._color = color
        self.init_draw = True
        self.draw()

    def draw(self):
        scale = self.grid.scale # type: ignore
        x = self.col * scale
        y = self.row * scale
        try:
            self.ctx.clearRect(x, y, scale, scale) # type: ignore
            self.ctx.lineWidth = 0 # type: ignore
            self.ctx.fillStyle = self.color # type: ignore
            self.ctx.fillRect(x, y, scale, scale) # type: ignore
            self.draw_text()
        except:
            pass

    def draw_text(self):
        if self.text == '':
            return

        scale = self.grid.scale # type: ignore
        x = self.col * scale
        y = self.row * scale
        self.ctx.fillStyle = self.text_color  # type: ignore
        self.ctx.textAlign = 'center'  # type: ignore
        self.ctx.textBaseline = 'middle'  # type: ignore
        padding = scale * 0.05  # 5% padding on each side
        max_width = scale - padding * 2
        max_height = scale - padding * 2

        font_size = max_height * self._text_scale
        min_font_size = 6  # don't go below this, or just hide text

        while font_size > min_font_size:
            self.ctx.font = f'{font_size}px Arial'  # type: ignore
            text_width = self.ctx.measureText(self.text).width  # type: ignore
            if text_width <= max_width:
                break
            font_size -= 1

        self.ctx.font = f'{font_size}px Arial'  # type: ignore
        self.ctx.fillText(self.text, x + scale / 2, y + scale / 2)  # type: ignore

    def copy(self, grid):
        return Cell(grid, self.col, self.row, self.color)

    def __repr__(self):
        return self.color

class Line():
    line: list = []
    n = 0
    max = 0
    def __init__(self, grid, row, cols: int | list, color: str = ''):
        self.grid = grid
        if type(cols) == list:
            self.line = cols # type: ignore
        else:
            self.line = [Cell(grid, col, row, color) for col in range(cols)] # type: ignore
        self.max = len(self.line) # type: ignore
    
    def __getitem__(self, key):
        return self.line[key]

    def __setitem__(self, key, value):
        self.line[key].color = value

    def __repr__(self):
        return ', '.join([f'{r.color}' for r in self.line])

    def __iter__(self):
        self.n = 0
        return self

    def __next__(self):
        if self.n < self.max:
            result = self[self.n]
            self.n += 1
            return result
        else:
            raise StopIteration
    
    def __len__(self):
        return self.max

    def draw(self):
        for rect in self.line:
            rect.draw()
    
    def copy(self, grid):
        return Line(grid, self.line[0].row, [l.copy(grid) for l in self.line]) # type: ignore

class Grid():
    lines = []
    n = 0
    max = 0
    CANVAS_ID = ''
    WIDTH = 500
    HEIGHT = 500
    scale = 10
    record_gif = False
    frames = {}

    def __init__(self, rows: int, cols: int, color: str = '', scale: int = -1):
        if scale < 0:
            if rows > 0 and cols > 0:
                scale = min(Grid.WIDTH // cols, Grid.HEIGHT // rows)
            else:
                scale = 10
        self.scale = scale
        self.lines = [Line(self, row, cols, color) for row in range(rows)]
        self.max = rows
        if color != '':
            self.draw()
    
    @staticmethod
    def setup(width: int, height: int, record_gif: bool = False):
        Grid.HEIGHT = height
        Grid.WIDTH = width
        Grid.record_gif = record_gif
        Grid.frames = {}
        canvas = document[Config.CANVAS_ID]
        parent = canvas.parent
        parent.replaceChildren()
    
        canv = document.createElement('canvas')
        canv.style.display = 'block'
        canv.id = Config.CANVAS_ID;
        canv.attrs['height'] = height
        canv.attrs['width'] = width
        canv.style.width = f'{width}px'
        canv.style.height = f'{height}px'
        parent.appendChild(canv)

    @staticmethod
    def from_text(bin_text: str, colors={'s': 'black', '1': 'black', 'x': 'black', 'bg': ''}):
        lines = bin_text.lower().splitlines()
        if 'bg' not in colors:
            colors['bg'] = ''
        while len(lines) > 0 and len(lines[0]) == 0:
            lines.pop(0)
        size_y = len(lines)
        if size_y < 1:
            raise Exception('Grid must have at least one non empty line')
        size_x = max(map(lambda x: len(x), lines))

        scale = min(Grid.WIDTH // size_x, Grid.HEIGHT // size_y)
        grid = Grid(0, 0, colors['bg'], scale)
        raw_grid = []
        for line in lines:
            raw_line = []
            for x in range(size_x):
                if x < len(line):
                    raw_line.append(Cell(grid, x, len(raw_grid), colors.get(line[x], colors['bg'])))
                else:
                    raw_line.append(Cell(grid, x, len(raw_grid), colors['bg']))
            raw_grid.append(Line(grid, len(raw_grid), raw_line))
        grid.set_lines(raw_grid)
        grid.draw()
        return grid
        

    def set_lines(self, lines):
        self.lines = lines
        self.max = len(lines)

        
    def to_list(self):
        return [[c.color for c in l.line] for l in self.lines]

    @property
    def color_grid(self):
        return self.to_list()

    @property
    def grid(self):
        return self.to_list()

    @property
    def size(self):
        return (self.dim_y, self.dim_x)

    @property
    def dim_x(self):
        if self.max < 1:
            return 0
        return len(self[0])

    @property
    def dim_y(self):
        return len(self.lines)

    @staticmethod
    def clear_canvas():
        try:
            canvas = document[Config.CANVAS_ID]
            ctx = canvas.getContext('2d')
            ctx.clearRect(0, 0, Grid.WIDTH, Grid.HEIGHT) # type: ignore
        except:
            pass


    def draw(self):
        for line in self.lines:
            line.draw()

    @staticmethod
    def gif_add():
        if Grid.record_gif:
            canvas = document[Config.CANVAS_ID]
            frameName = 'frame_' + str(len(Grid.frames)).rjust(3, '0')
            Grid.frames[frameName] = canvas.toDataURL('image/png');



    def fill(self, color: str = ''):
        for line in self.lines:
            for cell in line:
                cell.color = color

    def copy(self):
        cp = Grid(0, 0)
        lines = [l.copy(cp) for l in self.lines]
        cp.set_lines(lines)
        return cp


    def __getitem__(self, key):
        return self.lines[key]

    def __setitem__(self, key, value):
        self.lines[key] = value
        
    def __repr__(self):
        rep = ''
        for line in self.lines:
            rep += f'{line}'
            rep += '\n'
        return rep
    
    def __iter__(self):
        self.n = 0
        return self

    def __next__(self):
        if self.n < self.max:
            result = self[self.n]
            self.n += 1
            return result
        else:
            raise StopIteration

    def __len__(self):
        return self.max