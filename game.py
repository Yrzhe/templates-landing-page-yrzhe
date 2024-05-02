import random
import time
import curses

# Initialize the screen
curses.initscr()
win = curses.newwin(20, 60, 0, 0)  # height, width, start_y, start_x
win.keypad(1)
curses.noecho()
curses.curs_set(0)
win.border(0)
win.nodelay(1)

# Snake and food
snake = [(4, 10), (4, 9), (4, 8)]
food = (10, 20)

win.addch(food[0], food[1], '#')

# Game logic
score = 0
ESC = 27
key = curses.KEY_RIGHT
speed = 120  # milliseconds

# Historical records
historical_records = []

while key != ESC:
    win.addstr(0, 2, 'Score: ' + str(score) + ' ')
    win.timeout(speed)

    prev_key = key
    event = win.getch()
    key = event if event != -1 else prev_key

    if key not in [curses.KEY_LEFT, curses.KEY_RIGHT, curses.KEY_UP, curses.KEY_DOWN, ESC]:
        key = prev_key

    # Calculate the new head of the snake
    y = snake[0][0]
    x = snake[0][1]
    if key == curses.KEY_DOWN:
        y += 1
    if key == curses.KEY_UP:
        y -= 1
    if key == curses.KEY_LEFT:
        x -= 1
    if key == curses.KEY_RIGHT:
        x += 1

    snake.insert(0, (y, x))  # append an new head of the snake

    # Check if snake hits the border
    if y == 0 or y == 19 or x == 0 or x == 59:
        break
    # Check if snake hits itself
    if snake[0] in snake[1:]:
        break

    # Check if snake gets the food
    if snake[0] == food:
        score += 1
        food = ()
        while food == ():
            food = (random.randint(1, 18), random.randint(1, 58))
            if food in snake:
                food = ()
        win.addch(food[0], food[1], '#')
    else:
        # Move snake
        last = snake.pop()
        win.addch(last[0], last[1], ' ')

    win.addch(snake[0][0], snake[0][1], '*')

# Store score in historical records
historical_records.append((score, time.ctime()))
historical_records = sorted(historical_records, key=lambda x: x[0], reverse=True)[:10]

# End the game
curses.endwin()
print("Final Score:", score)
print("Top Scores:")
for idx, record in enumerate(historical_records):
    print(f"{idx + 1}. {record[0]} - {record[1]}")

