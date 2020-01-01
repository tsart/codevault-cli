{%- meta tables = 'tables.json' -%}
{%- meta config = 'config.json' -%}
{%- meta core = 'core.json' -%}
{%- set internalColumns = core.internalColumns | pickBy(core.objectType.logging) -%}

PRINT '--- CREATE TABLES ---'
{% import 'create.sql' as create -%}
{% for objectName, table in tables %}
  {%- if table.type in ['Table'] -%}
    {{ create.createTable(table, internalColumns, config.settings, config.dataTypes) }}
  {%- endif -%}
{% endfor %}

PRINT '--- CREATE FUNCTIONS ---'
{% include 'fn/formatMessage.sql' %}

PRINT '--- CREATE PROCEDURES ---'
{% for logLevel in config.settings.logLevels %}
  {%- set procedure = {name: logLevel} -%}
  {%- set table = tables.records -%}
  {{- create.spMessage(procedure, table, internalColumns, config.settings, config.dataTypes) }}
{% endfor %}

{%- meta package = 'package.json' -%}
Exec log.info 'codevault-20191231', '{{package.name}}', 'main', 'Code generation succeeded'
Exec log.info 'codevault-20191231', '{{package.name}}', 'package.json', '{{package | dump | safe}}'
Exec log.info 'codevault-20191231', '{{package.name}}', 'tables.json', '{{tables | dump | safe}}'
Exec log.info 'codevault-20191231', '{{package.name}}', 'config.json', '{{config | dump | safe}}'
Exec log.info 'codevault-20191231', '{{package.name}}', 'core.json', '{{core | dump | safe}}'

