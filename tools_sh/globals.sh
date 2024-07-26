print_color() {
  local color_code="$1"
  local text="$2"
  echo -e "${color_code}${text}\033[0m"
}

print_color_enclosed() {
  local color_code="$1"
  local text="$2"
  echo -e "${color_code}--${text}--\033[0m"
}