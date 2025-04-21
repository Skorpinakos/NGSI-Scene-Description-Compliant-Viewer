import time
import board
import busio
import adafruit_bno055

i2c = busio.I2C(board.SCL, board.SDA)

try:
    sensor = adafruit_bno055.BNO055_I2C(i2c)
    print("Sensor initialized!")
    print("Temperature:", sensor.temperature)
    print("Euler angles:", sensor.euler)
except Exception as e:
    print("Failed to connect to BNO055:", e)
