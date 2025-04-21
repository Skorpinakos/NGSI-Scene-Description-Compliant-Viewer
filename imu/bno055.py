import time
import board
import busio
import adafruit_bno055

i2c = busio.I2C(board.SCL, board.SDA)

try:
    sensor = adafruit_bno055.BNO055_I2C(i2c)
    print("Sensor initialized!")
    
    while True:
        try:
            print("Euler angles:", sensor.euler)
            time.sleep(1)
        except KeyboardInterrupt:
            print("Exiting loop.")
            break
except Exception as e:
    print("Failed to connect to BNO055:", e)
