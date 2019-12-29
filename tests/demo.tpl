-- Demo template
{# 

-- simple rendering
[{{ source.schemaName }}].[{{ source.tableName }}]

-- rendering with filter
{{ 1424197820 | time }}

-- test system environment parameter

{% include "_layout.tpl" %} -#}
-- read template from NPM package and render it
{% require code = "@codevault/sql-poc" -%}
{# {% require code = "@codevault/sql-poc", contentType = "md" %} -#}
{# {% require code = "@codevault/sql-poc", objectName = 'info' %} -#}
{{ code | fetch | safe }}

{{ env.CODEVAULT_ENV }}
{# EXEC [{{logging.schemaName}}].info 'Test message' -#}

