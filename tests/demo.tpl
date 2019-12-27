-- Demo template

-- simple rendering
[{{ source.schemaName }}].[{{ source.tableName }}]

-- rendering with filter
{{ 1424197820 | time }}

-- read template from NPM package and render it
{% require code = "@codevault/sql-poc/install.sql" %}
{{ code | fetch ({schemaName: source.schemaName, tableName: source.tableName}) | safe }}

-- test system environment parameter
{{ env.NODE_ENV }}
