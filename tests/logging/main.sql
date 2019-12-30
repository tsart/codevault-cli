{%- meta tables = 'tables.json' -%}
{%- meta config = 'config.json' -%}
{%- meta core = 'core.json' -%}
{%- set internalColumns = core.internalColumns | pickBy(core.objectType.logging) -%}

PRINT "--- CREATE TABLES ---"
{% import 'create.sql' as create -%}
{% for objectName, table in tables %}
  {%- if table.type in ['Table'] -%}
    {{ create.createTableExt(table, internalColumns, config.settings, config.dataTypes) }}
  {%- endif -%}
{% endfor %}
