def parse_time_to_milliseconds(time_str):
    """
    Standalone function to parse time strings to milliseconds.
    """
    if not time_str:
        raise ValueError("Time string cannot be empty")
    
    time_str = str(time_str).strip()
    
    # Split by colons to get time components
    parts = time_str.split(':')
    
    if len(parts) == 1:
        # Format: ss.SS
        seconds_part = parts[0]
    elif len(parts) == 2:
        # Format: mm:ss.SS
        minutes_part, seconds_part = parts
        minutes = int(minutes_part)
        if minutes >= 60:
            raise ValueError(f"Invalid minutes: {minutes}")
    elif len(parts) == 3:
        # Format: h:mm:ss.SS or hh:mm:ss.SS
        hours_part, minutes_part, seconds_part = parts
        hours = int(hours_part)
        minutes = int(minutes_part)
        if minutes >= 60:
            raise ValueError(f"Invalid minutes: {minutes}")
    else:
        raise ValueError(f"Invalid time format: {time_str}")
    
    # Parse seconds and decimals
    if '.' in seconds_part:
        seconds_str, decimals_str = seconds_part.split('.')
        seconds = int(seconds_str)
        
        # Normalize decimals to milliseconds
        if len(decimals_str) == 1:
            milliseconds = int(decimals_str) * 100
        elif len(decimals_str) == 2:
            milliseconds = int(decimals_str) * 10
        elif len(decimals_str) == 3:
            milliseconds = int(decimals_str)
        else:
            # Truncate if more than 3 decimal places
            milliseconds = int(decimals_str[:3])
    else:
        seconds = int(seconds_part)
        milliseconds = 0
    
    if seconds >= 60:
        raise ValueError(f"Invalid seconds: {seconds}")
    
    # Set defaults for missing components
    if len(parts) == 1:
        hours, minutes = 0, 0
    elif len(parts) == 2:
        hours = 0
    
    # Convert to total milliseconds
    total_milliseconds = (
        hours * 60 * 60 * 1000 +
        minutes * 60 * 1000 +
        seconds * 1000 +
        milliseconds
    )
    
    return total_milliseconds