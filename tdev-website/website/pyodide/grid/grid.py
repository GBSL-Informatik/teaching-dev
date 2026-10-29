"""Packed grids for Teaching Dev's Pyodide renderer."""

from operator import index as _index
from pyodide.ffi import to_js as _to_js
from _grid_bridge import create_grid as _create_grid


def _position(value, length):
    value = _index(value)
    if value < 0:
        value += length
    if not 0 <= value < length:
        raise IndexError('Grid index out of range.')
    return value


class Cell:
    __slots__ = ('_grid', 'row', 'col')

    def __init__(self, grid, row, col):
        self._grid = grid
        self.row = row
        self.col = col

    @property
    def color(self):
        return self._grid._handle.get_color(self.row, self.col)

    @color.setter
    def color(self, color):
        self._grid._handle.set_color(self.row, self.col, color)

    @property
    def text(self):
        return self._grid._handle.get_text(self.row, self.col).text

    @text.setter
    def text(self, text):
        self._grid._handle.set_text(self.row, self.col, str(text))

    @property
    def text_color(self):
        return self._grid._handle.get_text(self.row, self.col).color

    @text_color.setter
    def text_color(self, color):
        self._grid._handle.set_text_color(self.row, self.col, color)

    @property
    def text_scale(self):
        return self._grid._handle.get_text(self.row, self.col).scale

    @text_scale.setter
    def text_scale(self, scale):
        self._grid._handle.set_text_scale(self.row, self.col, scale)

    def get(self, offset_x, offset_y):
        row = (self.row + _index(offset_y)) % self._grid.dim_y
        col = (self.col + _index(offset_x)) % self._grid.dim_x
        return self._grid[row][col]

    def __repr__(self):
        return self.color


class Row:
    __slots__ = ('_grid', '_row')

    def __init__(self, grid, row):
        self._grid = grid
        self._row = row

    def __getitem__(self, col):
        return Cell(self._grid, self._row, _position(col, self._grid.dim_x))

    def __setitem__(self, col, color):
        self[col].color = color

    def __len__(self):
        return self._grid.dim_x

    def __iter__(self):
        for col in range(len(self)):
            yield Cell(self._grid, self._row, col)


class Grid:
    def __init__(self, rows, cols, color='', *, grid_id='grid', palette=None, scale=None):
        colors = None if palette is None else _to_js(list(palette))
        self._handle = _create_grid(grid_id, rows, cols, color, colors, scale)

    @property
    def grid_id(self):
        return self._handle.grid_id

    @property
    def rows(self):
        return self._handle.rows

    @property
    def cols(self):
        return self._handle.cols

    @property
    def dim_x(self):
        return self._handle.cols

    @property
    def dim_y(self):
        return self._handle.rows

    @property
    def size(self):
        return (self.dim_y, self.dim_x)

    @property
    def scale(self):
        return self._handle.scale

    @property
    def palette(self):
        return tuple(self._handle.palette)

    @property
    def events(self):
        return self._handle.events

    @property
    def color_grid(self):
        return self.to_list()

    @property
    def grid(self):
        return self.to_list()

    def fill(self, color=''):
        self._handle.fill(color)

    def set_cells(self, values, palette=None):
        colors = None if palette is None else _to_js(list(palette))
        # A buffer view avoids converting a NumPy array into a million Python objects.
        with memoryview(values) as view:
            self._handle.set_cells(view, colors)

    async def render(self):
        await self._handle.render()

    def copy(self, *, grid_id=None):
        grid = Grid.__new__(Grid)
        grid._handle = self._handle.copy(self.grid_id if grid_id is None else grid_id)
        return grid

    def to_list(self):
        return [[cell.color for cell in row] for row in self]

    @classmethod
    def from_text(cls, text, colors=None, *, grid_id='grid', scale=None):
        colors = {'s': 'black', '1': 'black', 'x': 'black'} if colors is None else dict(colors)
        lines = text.lower().splitlines()
        while lines and not lines[0]:
            lines.pop(0)
        cols = max(map(len, lines), default=0)
        if cols == 0:
            raise ValueError('Grid text must contain at least one non-empty line.')
        background = colors.get('bg', '')
        grid = cls(len(lines), cols, background, grid_id=grid_id, scale=scale)
        for row, line in enumerate(lines):
            for col, character in enumerate(line):
                grid[row][col] = colors.get(character, background)
        return grid

    def __getitem__(self, row):
        return Row(self, _position(row, self.dim_y))

    def __setitem__(self, row, colors):
        values = list(colors)
        if len(values) != self.dim_x:
            raise ValueError('A row must contain exactly dim_x colors.')
        target = self[row]
        for col, color in enumerate(values):
            target[col] = color

    def __len__(self):
        return self.dim_y

    def __iter__(self):
        for row in range(len(self)):
            yield Row(self, row)
