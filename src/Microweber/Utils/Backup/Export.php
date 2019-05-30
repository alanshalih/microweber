<?php
namespace Microweber\Utils\Backup;

use Microweber\Utils\Backup\Exporters\JsonExport;
use Microweber\Utils\Backup\Exporters\CsvExport;
use Microweber\Utils\Backup\Exporters\XmlExport;
use Microweber\Utils\Backup\Exporters\ZipExport;

class Export
{
	public $skipTables;
	public $exportData;
	public $type = 'json';
	
	public function setType($type)
	{
		$this->type = $type;
	}
	
	public function setExportData($data) {
		$this->exportData = $data;
	}
	
	public function exportAsType($data)
	{
		$export = false;
		
		switch ($this->type) {
			case 'json':
				$export = new JsonExport($data);
				break;
				
			case 'csv':
				$export = new CsvExport($data);
				break;
				
			case 'xml':
				$export = new XmlExport($data);
				break;
				
			case 'zip':
				$export = new ZipExport($data);
				break;
			// Don't forget a break
		}
		
		if ($export) {
			return array(
				'success' => count($data, COUNT_RECURSIVE) . ' items are exported',
				'export_type' => $this->type,
				'data' => $export->start()
			);
		} else {
			return array(
				'error' => 'Export format not supported.'
			);
		}
	}

	public function getContent() {
		
		$readyContent = array();
		$tables = $this->_getTablesForExport();
		
		foreach($tables as $table) {
			
			$ids = array();
			
			if ($table == 'categories') {
				if (!empty($this->exportData['categoryIds'])) {
					$ids = $this->exportData['categoryIds'];
				}
			}
			
			if ($table == 'content') {
				if (!empty($this->exportData['contentIds'])) {
					$ids = $this->exportData['contentIds'];
				}
			}
			
			$tableContent = $this->_getTableContent($table, $ids);
			
			if (!empty($tableContent)) {
				
				$relations = array();
				foreach($tableContent as $content) {
					if (isset($content['rel_type']) && isset($content['rel_id'])) {
						$relations[$content['rel_type']][$content['rel_id']] = $content['rel_id'];
					}
				}
				
				if (!empty($relations)) {
					foreach($relations as $relationTable=>$relationIds) {
						$relationTableContent = $this->_getTableContent($relationTable, $relationIds);
						
						
						var_dump($relationTableContent);
						die();
					}
				}
				
				var_dump($relations);
				die();
				
				$readyContent[$table] = $tableContent;
			}
		}
		
		return $readyContent;
		
	}
	
	private function _getTableContent($table, $ids = array()) {
		
		$exportFilter = array();
		$exportFilter['no_limit'] = 1;
		$exportFilter['do_not_replace_site_url'] = 1;
		
		if (!empty($ids)) {
			$exportFilter['ids'] = implode(',', $ids);
		}
		
		return db_get($table, $exportFilter);
	}
	
	private function _skipTablesForExport() {
		
		$this->skipTables[] = 'modules';
		$this->skipTables[] = 'elements';
		$this->skipTables[] = 'users';
		$this->skipTables[] = 'log';
		$this->skipTables[] = 'notifications';
		$this->skipTables[] = 'content_revisions_history';
		$this->skipTables[] = 'module_templates';
		$this->skipTables[] = 'stats_users_online';
		$this->skipTables[] = 'stats_browser_agents';
		$this->skipTables[] = 'stats_referrers_paths';
		$this->skipTables[] = 'stats_referrers_domains';
		$this->skipTables[] = 'stats_referrers';
		$this->skipTables[] = 'stats_visits_log';
		$this->skipTables[] = 'stats_urls';
		$this->skipTables[] = 'system_licenses';
		$this->skipTables[] = 'users_oauth';
		$this->skipTables[] = 'sessions';
		
		return $this->skipTables;
	}

	private function _getTablesForExport() {
		
		$skipTables = $this->_skipTablesForExport();
		
		if (!empty($this->exportData['categoryIds'])) {
			if (!in_array('categories',$this->exportData['tables'])) {
				$this->exportData['tables'][] = 'categories';
			}
		}
		
		if (!empty($this->exportData['contentIds'])) {
			if (!in_array('content', $this->exportData['tables'])) {
				$this->exportData['tables'][] = 'content';
			}
		}
		
		if (!empty($this->exportData['tables'])) {
			if (in_array('users', $this->exportData['tables'])) {
				$keyOfSkipTable = array_search('users', $skipTables);
				if ($keyOfSkipTable) {
					unset($skipTables[$keyOfSkipTable]);
				}
			}
		}
		
		$tablesList = mw()->database_manager->get_tables_list();
		$tablePrefix = mw()->database_manager->get_prefix();
		
		$readyTableList = array();
		foreach ($tablesList as $tableName) {
			
			if ($tablePrefix) {
				$tableName = str_replace_first($tablePrefix, '', $tableName);
			}
			
			if (in_array($tableName, $skipTables)) {
				continue;
			}
			
			if (!empty($this->exportData)) {
				if (isset($this->exportData['tables'])) {
					if (!in_array($tableName, $this->exportData['tables'])) {
						continue;
					}
				}
			}
			
			$readyTableList[] = $tableName;
			
		}
		
		return $readyTableList;
	}
}