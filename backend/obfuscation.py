def obfuscate_series(series: str) -> str:
    """'6011' -> '60**'"""
    if len(series) <= 2:
        return series
    return series[:2] + "*" * (len(series) - 2)


def obfuscate_number(number: str) -> str:
    """'620891' -> '6***91'"""
    if len(number) <= 2:
        return number
    return number[0] + "*" * (len(number) - 2) + number[-1]


def obfuscate_name(name: str) -> str:
    """'Иван' -> 'И***'"""
    if not name:
        return name
    return name[0] + "*" * (len(name) - 1)
