{% macro createTable(table, settings, dataTypes) -%}
{%- set schemaName = table.schemaName if table.schemaName else settings.schemaName -%}
{%- set tableName = table.tableName -%}
{%- set columns = table.columns -%}
{%- set columnsPK = table.columnsPK -%}
{%- set createParameters = table.createParameters -%}
{%- set integers = dataTypes.integers -%}
{%- set numbers = dataTypes.numbers -%}
{%- set strings = dataTypes.strings -%}
{%- set dates = dataTypes.dates -%}
{%- set times = dataTypes.times -%}
{%- set datetimes = dataTypes.datetimes -%}
{%- set largeObjects = dataTypes.largeObjects -%}
IF OBJECT_ID('[{{schemaName}}].[{{tableName}}]', 'U') IS NULL BEGIN
  CREATE TABLE [{{schemaName}}].[{{tableName}}] (
    {%- for key in columns %}
    [{{key.name}}] [{{key.dataType}}] 
    {%- if key.dataType in strings and key.characterMaximumLength > 0 -%} ({{-key.characterMaximumLength-}})
    {%- elif key.dataType in largeObjects and (not key.characterMaximumLength or key.characterMaximumLength == -1) -%} (max)
    {%- elif key.dataType in numbers and key.numericPrecision > 0 and key.numericScale > 0 -%} ({{key.numericPrecision}},{{key.numericScale-}})
    {%- endif %} {{ "NULL" if key.isNullable else "NOT NULL"-}}
    {{- "," -}}
    {%- if key.name in columnsPK %} -- PK {%- endif -%}
    {% endfor %}
    dwSessionNo [varchar](50) NOT NULL,
    dwPackageName [varchar](100) NOT NULL,
    dwStartDate [datetime] NOT NULL,
    dwVersion [int] NOT NULL,
    dwUpdateDate [datetime] NOT NULL,
    dwHash [varchar](40) NOT NULL
  ) {{createParameters}}
END

{% endmacro %}

{% macro createTableExt(table, internalColumns, settings, dataTypes) -%}
{%- set schemaName = table.schemaName if table.schemaName else settings.schemaName -%}
{%- set tableName = table.tableName -%}
{%- set columns = table.columns | merge(internalColumns) | sort(false, false, 'ordinalPosition') -%}
{%- set columnsPK = table.columnsPK -%}
{%- set createParameters = table.createParameters -%}
{%- set integers = dataTypes.integers -%}
{%- set numbers = dataTypes.numbers -%}
{%- set strings = dataTypes.strings -%}
{%- set dates = dataTypes.dates -%}
{%- set times = dataTypes.times -%}
{%- set datetimes = dataTypes.datetimes -%}
{%- set largeObjects = dataTypes.largeObjects -%}
IF OBJECT_ID('[{{schemaName}}].[{{tableName}}]', 'U') IS NULL BEGIN
  CREATE TABLE [{{schemaName}}].[{{tableName}}] (
    {%- for key in columns %}
    [{{key.name}}] [{{key.dataType}}] 
    {%- if key.dataType in strings and key.characterMaximumLength > 0 -%} ({{-key.characterMaximumLength-}})
    {%- elif key.dataType in largeObjects and (not key.characterMaximumLength or key.characterMaximumLength == -1) -%} (max)
    {%- elif key.dataType in numbers and key.numericPrecision > 0 and key.numericScale > 0 -%} ({{key.numericPrecision}},{{key.numericScale-}})
    {%- endif %} {{ "IDENTITY(1,1) " if key.autoIncrement }}{{ "NULL" if key.isNullable else "NOT NULL"-}}
    {{- "," -}}
    {%- if key.name in columnsPK %} -- PK {%- endif -%}
    {% endfor %}
  ) {{createParameters}}
END

{% endmacro %}
