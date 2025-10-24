Naming conventions:
    - Names of things should be lower_case_with_underscores
    - Tables should describe the thing stored in each row as plural e.g. fruits, houses, etc.
    - Columns of properties of x in table {x}s should be called {x}_field_name e.g. fruit_name in table fruits
    - If {x} has a ForeignKey to {y}, the corresponding relationships should be defined by {y}_of_{x} in {x} and  {x}s_of_{y} in {y} e.g. fruits_with_colour and colour_of_fruit
    - If {x} has a ForeignKey to {y}, the ForeignKey column name should be called {y}_id in {x} e.g. colour_id in fruit
    - Convention may be broken in the case that breaking a naming convention gives a more descriptive column