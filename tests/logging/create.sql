{% macro createTable(table, internalColumns, settings, dataTypes) -%}
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

IF OBJECT_ID('[{{schemaName}}].[{{tableName}}]', 'U') IS {{-' NOT NULL DROP TABLE [{{schemaName}}].[{{tableName}}]
GO' 
    | renderString({schemaName: schemaName, tableName: tableName}) if settings.dropTables else ' NULL'}} 
CREATE TABLE [{{schemaName}}].[{{tableName}}] (
  {%- for key in columns %}
  [{{key.name}}] [{{key.dataType}}] 
  {%- if key.dataType in strings and key.characterMaximumLength > 0 -%} ({{-key.characterMaximumLength-}})
  {%- elif key.dataType in largeObjects and (not key.characterMaximumLength or key.characterMaximumLength == -1) -%} (max)
  {%- elif key.dataType in numbers and key.numericPrecision > 0 and key.numericScale > 0 -%} ({{key.numericPrecision}},{{key.numericScale-}})
  {%- endif %} {{ "IDENTITY(1,1) " if key.autoIncrement }}{{ "NULL" if key.isNullable else "NOT NULL"-}}
  {{- "," -}}
  {{- ' -- PK' if key.name in columnsPK -}} 
  {{- ' -- ' + key.description if key.description -}} 
  {% endfor %}
) {{createParameters}}
GO
{% endmacro %}


{% macro spMessage(procedure, table, internalColumns, settings, dataTypes) -%}
{%- set procedureName = procedure.name -%}
{%- set procedureName = procedure.name -%}
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
IF OBJECT_ID('[{{schemaName}}].[{{procedureName}}]', 'P') IS NOT NULL DROP PROCEDURE [{{schemaName}}].[{{procedureName}}] 
GO
CREATE PROCEDURE [{{schemaName}}].[{{procedureName}}] 
  @sessionNo varchar(40),
  @packageName varchar(40),
  @objectCode varchar(250),
  @message varchar(max) 
AS 
BEGIN
  INSERT INTO [log].[records] (logLevel, [message], detail,
    dwSessionNo, dwPackageName, dwObjectCode, dwCreateBy, dwCreateDate)
  SELECT '{{procedureName}}', isNull(@message, JSON_VALUE(log.formatMessage(@message),'$.error.message')), log.formatMessage(@message),
    @sessionNo, @packageName, @objectCode, ORIGINAL_LOGIN(), getDate()
END
GO
{% endmacro %}

{% macro createFunction(function, table, internalColumns, settings, dataTypes) -%}
{%- set functionName = function.name -%}
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
IF OBJECT_ID('[{{schemaName}}].[{{functionName}}]', 'FN') IS {{-' NOT NULL DROP FUNCTION [{{schemaName}}].[{{functionName}}]' 
  | renderString({schemaName: schemaName, functionName: functionName}) if settings.dropFunctions else ' NULL'}} 
BEGIN
  CREATE FUNCTION [{{schemaName}}].[{{functionName}}] 
{#
  #}
{% endmacro %}