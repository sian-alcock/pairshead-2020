def decode_utf8(input_iterator):
    for l in input_iterator:
        yield l.decode('utf-8')