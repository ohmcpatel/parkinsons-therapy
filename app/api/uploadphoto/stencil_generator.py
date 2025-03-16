import cv2
import sys
from PIL import Image

def generate_stencil(input_path, output_path):
    # Load the image in grayscale
    image = cv2.imread(input_path, cv2.IMREAD_GRAYSCALE)

    # Apply Gaussian blur
    blurred = cv2.GaussianBlur(image, (5,5), 0)

    # Apply Canny edge detection
    edges = cv2.Canny(blurred, 50, 150)

    # Save the result
    stencil_image = Image.fromarray(edges)
    stencil_image.save(output_path)

if __name__ == "__main__":
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    generate_stencil(input_path, output_path)
