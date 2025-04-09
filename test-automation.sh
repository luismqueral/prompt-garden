#!/bin/bash

# Prompt Garden Test Automation Script
# This script automates the process of generating test data

# Color definitions
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Default values
DATA_COUNT=100
CLEAN_AFTER=false
USE_LONG_PROMPTS=false
COMPLEXITY_LEVEL="medium"
CLEAN_TEST_DATA=false
SHOW_HELP=false

# Print usage information
function print_usage {
  echo -e "\n${BOLD}🪴 Prompt Garden Test Automation${NC}"
  echo -e "${CYAN}Usage:${NC} $0 [options]"
  echo ""
  echo -e "${BOLD}Options:${NC}"
  echo -e "  ${YELLOW}--count N${NC}             Generate N test prompts (default: 100)"
  echo -e "  ${YELLOW}--clean-test-data${NC}     Clean all test data from the spreadsheet"
  echo -e "  ${YELLOW}--long-prompts${NC}        Generate long content prompts for testing"
  echo -e "  ${YELLOW}--complexity LEVEL${NC}    Set syntax complexity level (low, medium, high, extreme)"
  echo -e "  ${YELLOW}--help${NC}                Display this help message"
  echo ""
  echo -e "${BOLD}Examples:${NC}"
  echo -e "  ${CYAN}$0 --count 500${NC}                        Generate 500 test prompts"
  echo -e "  ${CYAN}$0 --long-prompts${NC}                     Generate prompts with varying lengths"
  echo -e "  ${CYAN}$0 --complexity high${NC}                  Generate prompts with high syntax complexity"
  echo -e "  ${CYAN}$0 --count 50 --long-prompts --complexity extreme${NC}  Combined options"
  echo -e "  ${CYAN}$0 --clean-test-data${NC}                  Remove all test data from the spreadsheet"
  echo ""
}

# Check if script was run without arguments
if [ $# -eq 0 ]; then
  print_usage
  exit 0
fi

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --count)
      DATA_COUNT="$2"
      shift
      ;;
    --clean-test-data)
      CLEAN_TEST_DATA=true
      ;;
    --long-prompts)
      USE_LONG_PROMPTS=true
      ;;
    --complexity)
      COMPLEXITY_LEVEL="$2"
      shift
      ;;
    --complexity=*)
      COMPLEXITY_LEVEL="${1#*=}"
      ;;
    --help)
      print_usage
      exit 0
      ;;
    *)
      echo -e "${RED}❌ Unknown parameter:${NC} $1"
      print_usage
      exit 1
      ;;
  esac
  shift
done

# If clean-test-data is set, clean the data and exit
if [ "$CLEAN_TEST_DATA" = true ]; then
  echo -e "\n${BLUE}🧹 Cleaning up all test data...${NC}"
  node test-data-generator.js --clean
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error:${NC} Failed to clean test data"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Test data cleanup complete!${NC}"
  exit 0
fi

# Validate complexity level
if [[ "$COMPLEXITY_LEVEL" != "low" && "$COMPLEXITY_LEVEL" != "medium" && "$COMPLEXITY_LEVEL" != "high" && "$COMPLEXITY_LEVEL" != "extreme" ]]; then
  echo -e "${RED}❌ Invalid complexity level:${NC} $COMPLEXITY_LEVEL"
  echo -e "${YELLOW}Valid options are:${NC} low, medium, high, extreme"
  exit 1
fi

echo -e "\n${BOLD}${GREEN}=== 🪴 Prompt Garden Test Automation ===${NC}"
echo ""
echo -e "${BOLD}Configuration:${NC}"
echo -e "  ${BLUE}•${NC} Test data count: ${YELLOW}$DATA_COUNT${NC}"
echo -e "  ${BLUE}•${NC} Generate long prompts: ${YELLOW}$USE_LONG_PROMPTS${NC}"
echo -e "  ${BLUE}•${NC} Complexity level: ${YELLOW}$COMPLEXITY_LEVEL${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Error:${NC} Node.js is required to run the test data generator"
  exit 1
fi

# Prepare the command arguments
CMD_ARGS="--count $DATA_COUNT"

if $USE_LONG_PROMPTS; then
  CMD_ARGS="$CMD_ARGS --long-prompts"
fi

CMD_ARGS="$CMD_ARGS --complexity $COMPLEXITY_LEVEL"

# Generate test data
echo -e "${BLUE}🔄 Generating test data...${NC}"
echo -e "${CYAN}Running:${NC} node test-data-generator.js $CMD_ARGS"
node test-data-generator.js $CMD_ARGS

# Check if data generation was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Error:${NC} Failed to generate test data"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Test data generated successfully!${NC}" 