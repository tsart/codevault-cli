-- Demo template 

-- read environment attribute
-- [{{ env.NODE_ENV }}]

-- simple rendering with user defined context
source.schemaName: [{{ source.schemaName }}]
source.tableName: [{{ source.tableName }}]
logging.schemaName: [{{logging.schemaName}}]
logging.logLevel: [{{ logging.logLevel }}]

-- read template from NPM package 
-- use default package context merged with user context in package namespace `logging`
-- Render the package content with custom context
-- :: START
{% require package = "@codevault/sql-poc" -%}
{{ package | renderString | safe }}
-- :: FINISH 

-- package context is not available from outside
logging.schemaName: [{{logging.schemaName}}]
logging.logLevel: [{{ logging.logLevel }}]
