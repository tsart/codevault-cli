{%- block header -%}
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
{%- set largeObjects = dataTypes.largeObjects %}

IF OBJECT_ID('[{{schemaName}}].[{{functionName}}]', 'FN') IS NOT NULL DROP FUNCTION [{{schemaName}}].[{{functionName}}]
GO
CREATE FUNCTION [{{schemaName}}].[{{functionName}}] 
{%- endblock -%}
{% block body%}{% endblock %}
{%- block footer -%}
{%- endblock -%}