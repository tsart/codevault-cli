{%- meta tables = 'tables.json' -%}
{%- meta config = 'config.json' -%}
{%- meta core = 'core.json' -%}
{%- set internalColumns = core.internalColumns | pickBy(core.objectType.logging) -%}

{%- set function = {name: 'formatMessage'} -%}
{%- set table = tables.records -%}
{%- set settings = config.settings -%}
{%- set dataTypes = config.dataTypes -%}

{%- extends "layout/_fn.sql" -%}
{%- block body -%}(
  @message nvarchar(max) 
) RETURNS nvarchar(max) AS 
BEGIN
  DECLARE @result nvarchar(max) = N'{}'
  DECLARE @error nvarchar(max) = N'{}'
  SET @error = JSON_MODIFY(@error, '$.number', ERROR_NUMBER())
  SET @error = JSON_MODIFY(@error, '$.state', ERROR_STATE())
  SET @error = JSON_MODIFY(@error, '$.procedure', ERROR_PROCEDURE())
  SET @error = JSON_MODIFY(@error, '$.message', ERROR_MESSAGE())
  IF (isJSON(@message) > 0 )
    SET @result = JSON_MODIFY(@result, '$.message', JSON_QUERY(@message))
  ELSE 
    SET @result = JSON_MODIFY(@result, '$.message', @message)

  IF @error != N'{}' SET @result = JSON_MODIFY(@result, '$.error', JSON_QUERY(@error))
  RETURN @result
END
GO
{% endblock %}

{%- block test %}
PRINT '--- TEST FUNCTION [{{schemaName}}].[{{function.name}}] ---'
PRINT '--- [message]: ' + CASE 
  WHEN 'test message' =
  JSON_VALUE([{{schemaName}}].[{{function.name}}]('test message'), '$.message')
  THEN 'PASSED' ELSE 'FAILED' END
GO
{% endblock %}


