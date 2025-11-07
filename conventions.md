# Naming conventions

## General
- Class names should be `PascalCase`.
- Functions, class attributes and methods should be `snake_case`.

## Database Models
- Names of columns should be `snake_case`.
- Table names should describe the thing stored in each row as plural (e.g. `fruits`, `houses`, etc.).
- Properties of `x` (columns in table `xs`) should be called `x_field_name` (e.g. `Fruit.fruit_name` in table named `fruits`).
- If `x` has a ForeignKey to `y`, the corresponding relationships should be defined by `y_of_x` in `x` and `xs_of_y` in `y` (e.g. `fruits_with_colour` in table `colours` and `colour_of_fruit` in table `fruits`).
- If `x` has a ForeignKey to `y`, the ForeignKey column name should be called `y_id` in `x` e.g. `colour_id` in table `fruits`.
- Convention may be broken in the case that breaking a naming convention gives a more descriptive column.

## Pydantic Schemas
- Objects intended for return to users should be self-describing.
- If such an object is associated with a db model, then the object should share the name with the db model, possibly with some suffix attached.
- _Example_:
    ```python
        # db model
        class LabelData(Base):
            some_metadata
            some_large_data
    ```
    ```python
        # pydantic schema
        class LabelData(BaseModel):
            some_metadata
            some_large_data
        
        class LabelDataMeta(BaseModel):
            some_metadata
    ```
- Pydantic models associated with specific user requests should be of the form `VerbObject` related to what the user wishes to do (e.g. `CreateObject`, `DeleteObject`, `UpdateObject`).
- If a module needs to send an ACK to client, should define a `OperationStatus` pydantic schema, where Operation is the operation that needs to be ACKed. 

## Service Modules:
- Names of service functions should follow the rules below: 
    - `query_object` for database queries
    - `modify_object` for database updates
    - `insert_object` for database inserts
    - `remove_object` for database removes
    - Optionally, add a `with_restriction` suffix to above names when need to restrict queries to certain objects
    - Optionally, add a `by_method` suffix to above names when method of performing operation is specified (e.g. `modify_label_data_by_stream` vs. `modify_label_data`).
    - For aggregate data, make the object in question plural.
- Parameters should go in the order of (1) db (2) other dependencies (e.g. `current_user`) (3) everything else.
- Try to be consistent with parameter order.
- Any dependency that the router layer has should be passed to this layer.

## Router Modules
- Names of functions should follow the rules below:
    - `read_object` for GET requests
    - `create_object` for POST requests
    - `update_object` for PATCH requests
    - `delete_object` for DELETE requests
    - Use plural for functions corresponding to endpoints that operate on a collection.
    - Use singular for functions corresponding to endpoints that operate on a single item.
- Parameters should go in the order of
    1. Path parameters
    2. Query parameters
    3. Request body
    4. Dependencies (e.g. `param : Annotated[Type, Depends(dependency_fn)]`)
- Try to be consistent with parameter order.
- Any dependencies that a router needs should be passed to the service layer

# Exceptions
- Be descriptive.
- Use common sense.

## Endpoints
- This is the wild west for now.
- Will fill this in eventually.

# Exception handling
- Custom exceptions should be defined in `exceptions.py` in each feature directory (e.g. `src/auth/exeptions.py`)
- Custom/pythonic exceptions should be raised in service modules on error, as opposed to returning error codes. Possible raised exceptions must be clearly outlined in docstring.
- Router functions are responsible for handling custom exceptions raised from service modules.  