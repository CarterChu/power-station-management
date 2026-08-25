<template>
  <div class="filing-page">
    <!-- 固定顶栏 -->
    <div class="filing-header">
      <div class="filing-header-left">
        <a-button type="text" class="back-btn" @click="handleBack">
          <template #icon><LeftOutlined /></template>
        </a-button>
        <a-tooltip :title="isEdit ? `修改建档-${projectInfo.projectName}` : props.initData?.policyMatched === false ? '非标准政策建档' : '标准政策建档'">
          <span class="filing-title">{{ isEdit ? `修改建档-${projectInfo.projectName}` : props.initData?.policyMatched === false ? '非标准政策建档' : '标准政策建档' }}</span>
        </a-tooltip>
        <a-tag color="green">建档</a-tag>
        <a-tag v-if="filingStatus" :color="STATUS_COLOR[filingStatus]">
          {{ STATUS_LABEL[filingStatus] }}
        </a-tag>
      </div>
      <a-space>
        <a-popconfirm
          title="确认作废该建档？"
          description="作废后电站编号与 OA 单号的关联将解除，且不可恢复。"
          ok-text="确认作废" ok-type="danger" cancel-text="取消"
          @confirm="handleVoid"
        >
          <a-button v-if="canVoid" danger>作废</a-button>
        </a-popconfirm>
        <a-button @click="handleBack">取消</a-button>
        <a-button :loading="saving" @click="handleSave">保存</a-button>
        <a-button type="primary" :loading="submitting" @click="handleSubmit">提交建档申请</a-button>
      </a-space>
    </div>

    <div ref="filingBodyRef" class="filing-body" :style="scrollPad > 0 ? { paddingBottom: scrollPad + 'px' } : {}">

    <!-- 退回原因卡片（仅审核不通过时展示） -->
    <div v-if="filingStatus === 'rejected'" class="reject-card">
      <div class="reject-card-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#dc2626;flex-shrink:0"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
        <span>审核不通过</span>
      </div>
      <div class="reject-card-body">
        <div class="reject-meta">
          <span class="reject-meta-item">退回环节 <strong>{{ rejectInfo.stage }}</strong></span>
          <span class="reject-meta-item">审核人 <strong>{{ rejectInfo.reviewer }}</strong></span>
          <span class="reject-meta-item">时间 {{ rejectInfo.time }}</span>
        </div>
        <div class="reject-reason">{{ rejectInfo.reason }}</div>
      </div>
    </div>

    <!-- 主体 -->
    <a-card :bordered="false" class="main-card" :style="filingStatus === 'rejected' ? { marginTop: '12px' } : {}" :body-style="{ padding: '20px' }">

      <!-- 建档信息摘要 -->
      <div v-if="props.initData" class="filing-summary">
        <span class="filing-summary-item">
          项目类型：<strong>{{ '公建 EMC' }}</strong>
        </span>
        <span class="filing-summary-divider" />
        <span class="filing-summary-item">
          政策匹配：<strong>{{ props.initData.policyMatched ? '标准政策' : '非标政策' }}</strong>
        </span>
        <template v-if="props.initData.policyMatched && props.initData.region?.length">
          <span class="filing-summary-divider" />
          <span class="filing-summary-item">
            项目地区：<strong>{{ props.initData.region.join(' / ') }}</strong>
          </span>
        </template>
        <template v-if="props.initData.oaNo">
          <span class="filing-summary-divider" />
          <span class="filing-summary-item">OA 单号：<strong>{{ props.initData.oaNo }}</strong></span>
        </template>
      </div>

      <!-- ── 项目信息 ────────────────────────────────────────── -->
      <div class="section-title section-title--toggle" :class="{ 'section-title--collapsed': !projectInfoOpen }" @click="projectInfoOpen = !projectInfoOpen">项目信息<DownOutlined class="section-toggle-icon" :class="{ rotated: !projectInfoOpen }" /></div>
      <div v-show="projectInfoOpen">
      <a-form ref="projectInfoRef" :colon="false" :model="projectInfo" layout="vertical">

        <!-- 系统信息 -->
        <!-- 基本信息 -->
        <div class="section-sub-title">基本信息</div>
        <a-row :gutter="[24, 0]">
          <a-col :span="6">
            <a-form-item label="电站类型">
              <a-input :value="projectInfo.stationType" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="项目名称" name="projectName"
              :rules="[{ required: true, message: '请输入项目名称' }, { max: 50, message: '最多50字' }]">
              <a-input v-model:value="projectInfo.projectName" placeholder="请输入" :maxlength="50" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="项目类型">
              <a-input :value="'公建 EMC'" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="匹配政策">
              <a-input value="标准政策" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="所属区域公司" name="regionCompany" :rules="[{ required: true, message: '请输入所属区域公司' }]">
              <a-input v-model:value="projectInfo.regionCompany" placeholder="请输入" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="项目地址" name="addressRegion" :rules="[{ required: true, message: '请选择至省市区/镇' }]">
              <a-cascader v-model:value="projectInfo.addressRegion" :options="REGION_OPTIONS"
                placeholder="省 / 市 / 区 / 乡镇" style="width:100%" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="详细地址" name="addressDetail"
              :rules="[{ required: true, message: '请输入详细地址' }, { max: 100, message: '最多100字' }]">
              <a-input v-model:value="projectInfo.addressDetail" placeholder="街道 / 楼栋 / 门牌号" :maxlength="100" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="项目容量" name="capacity" :rules="[
                { required: true, message: '请输入项目容量' },
                { type: 'number', min: 0.01, message: '容量须大于 0' },
                { type: 'number', max: 100000000, message: '容量不得超过 1 亿 KW' },
              ]">
              <a-input-number v-model:value="projectInfo.capacity" :min="0.01" :max="100000000" :precision="2"
                style="width:100%" addon-after="KW" placeholder="0.00" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="并网电压等级" name="gridVoltage" :rules="[{ required: true, message: '请选择并网电压等级' }]">
              <a-select v-model:value="projectInfo.gridVoltage" style="width:100%" placeholder="请选择">
                <a-select-option value="low">低压</a-select-option>
                <a-select-option value="high">中高压</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="代理商名称">
              <a-input :value="projectInfo.agentName" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="用电企业名称" name="userEntName"
              :rules="[{ required: true, message: '请输入用电企业名称' }, { max: 50, message: '最多50字' }]">
              <a-input v-model:value="projectInfo.userEntName" placeholder="请输入" :maxlength="50" />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 供应商信息 -->
        <div class="section-sub-title">供应商信息</div>
        <a-row :gutter="[24, 0]">
          <a-col :span="6">
            <a-form-item label="开发商名称" name="developerName"
              :rules="[{ required: true, message: '请选择开发商名称' }]">
              <a-select v-model:value="projectInfo.developerName" :options="DEVELOPER_OPTIONS"
                style="width:100%" placeholder="请选择或搜索" show-search
                :filter-option="(input: string, opt: any) => opt.label.includes(input)" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="施工商名称" name="constructorName"
              :rules="[{ required: true, message: '请选择施工商名称' }]">
              <a-select v-model:value="projectInfo.constructorName" :options="CONSTRUCTOR_OPTIONS"
                style="width:100%" placeholder="请选择或搜索" show-search
                :filter-option="(input: string, opt: any) => opt.label.includes(input)" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="监理商名称">
              <a-select v-model:value="projectInfo.supervisorName" :options="DEVELOPER_OPTIONS"
                style="width:100%" placeholder="请选择或搜索" show-search allow-clear
                :filter-option="(input: string, opt: any) => opt.label.includes(input)" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="设计商名称">
              <a-select v-model:value="projectInfo.designerName" :options="DEVELOPER_OPTIONS"
                style="width:100%" placeholder="请选择或搜索" show-search allow-clear
                :filter-option="(input: string, opt: any) => opt.label.includes(input)" />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 合同信息 -->
        <div class="section-sub-title">EMC信息</div>
        <a-row :gutter="[24, 0]">
          <a-col :span="6">
            <a-form-item label="EMC 电价" name="emcPrice" :rules="[{ required: true, message: '请输入EMC电价' }]">
              <a-input-number v-model:value="projectInfo.emcPrice" :min="0" :precision="4"
                style="width:100%" addon-after="元/kWh" placeholder="0.0000" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="EMC 年限" name="emcYears" :rules="[
                { required: true, message: '请输入EMC年限' },
                { type: 'integer', message: '年限须为整数' },
                { type: 'number', min: 0, max: 1000, message: '年限范围 0–1000' },
              ]">
              <a-input-number v-model:value="projectInfo.emcYears" :min="0" :max="1000" :precision="0"
                style="width:100%" addon-after="年" placeholder="0" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="消纳比例" name="consumptionRate" :rules="[
                { required: true, message: '请输入消纳比例' },
                { type: 'integer', message: '消纳比例须为整数' },
                { type: 'number', min: 0, max: 100, message: '消纳比例范围 0–100' },
              ]">
              <a-input-number v-model:value="projectInfo.consumptionRate" :min="0" :max="100" :precision="0"
                style="width:100%" addon-after="%" placeholder="0" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="公建机构类型" name="publicBuildType" :rules="[{ required: true, message: '请选择公建机构类型' }]">
              <a-select v-model:value="projectInfo.publicBuildType" style="width:100%" placeholder="请选择" allow-clear>
                <a-select-option value="education">科教文体公建</a-select-option>
                <a-select-option value="medical">医疗卫生公建</a-select-option>
                <a-select-option value="government">党政政务机构</a-select-option>
                <a-select-option value="enforcement">执法监管机构</a-select-option>
                <a-select-option value="public_welfare">公益事业单位机构</a-select-option>
                <a-select-option value="other">其他</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 附件上传 -->
        <a-row :gutter="[24, 0]" style="margin-top:16px">
          <a-col :span="12">
            <a-form-item name="propertyProof"
              :rules="[{ required: true, validator: (_: any, v: any[]) => v?.length ? Promise.resolve() : Promise.reject('请上传产权证明') }]">
              <template #label>产权证明<a-tooltip title="支持 PDF / JPG / PNG，最多5个，单文件 ≤ 200M"><QuestionCircleOutlined class="upload-hint-icon" /></a-tooltip></template>
              <FileUploadField v-model:file-list="projectInfo.propertyProof" :max-count="5" accept=".pdf,.jpg,.jpeg,.png" multiple>
                <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
              </FileUploadField>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item name="bizLicense"
              :rules="[{ required: true, validator: (_: any, v: any[]) => v?.length ? Promise.resolve() : Promise.reject('请上传营业执照/组织机构代码证') }]">
              <template #label>营业执照/组织机构代码证<a-tooltip title="支持 PDF / JPG / PNG，最多5个，单文件 ≤ 200M"><QuestionCircleOutlined class="upload-hint-icon" /></a-tooltip></template>
              <FileUploadField v-model:file-list="projectInfo.bizLicense" :max-count="5" accept=".pdf,.jpg,.jpeg,.png" multiple>
                <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
              </FileUploadField>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item name="bankAccountCert"
              :rules="[{ required: true, validator: (_: any, v: any[]) => v?.length ? Promise.resolve() : Promise.reject('请上传开户许可证') }]">
              <template #label>开户许可证<a-tooltip title="支持 PDF / JPG / PNG，最多1个，≤ 200M"><QuestionCircleOutlined class="upload-hint-icon" /></a-tooltip></template>
              <FileUploadField v-model:file-list="projectInfo.bankAccountCert" :max-count="1" accept=".pdf,.jpg,.jpeg,.png">
                <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
              </FileUploadField>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="法定代表人身份证-正面" name="idCardFront">
              <a-upload v-model:file-list="projectInfo.idCardFront" :max-count="1"
                list-type="picture-card" :custom-request="noopRequest" accept="image/*" class="id-card-upload">
                <div v-if="!projectInfo.idCardFront?.length" class="img-upload-trigger">
                  <PlusOutlined />
                  <div style="margin-top:6px;font-size:12px">上传图片</div>
                </div>
              </a-upload>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="法定代表人身份证-反面" name="idCardBack">
              <a-upload v-model:file-list="projectInfo.idCardBack" :max-count="1"
                list-type="picture-card" :custom-request="noopRequest" accept="image/*" class="id-card-upload">
                <div v-if="!projectInfo.idCardBack?.length" class="img-upload-trigger">
                  <PlusOutlined />
                  <div style="margin-top:6px;font-size:12px">上传图片</div>
                </div>
              </a-upload>
            </a-form-item>
          </a-col>
        </a-row>

      </a-form>

      <!-- ── 项目产权信息 ────────────────────────────────────── -->
      <div class="section-sub-title">项目产权信息</div>
      <a-form ref="projectPropertyRef" :colon="false" :model="projectProperty" layout="vertical">
        <a-row :gutter="[24, 0]">
          <a-col :span="6">
            <a-form-item label="项目公司" name="projectCompany"
              :rules="[{ required: true, message: '请选择项目公司' }]">
              <a-select v-model:value="projectProperty.projectCompany" :options="PROJECT_COMPANY_OPTIONS"
                style="width:100%" placeholder="请选择或搜索" show-search
                :filter-option="(input: string, opt: any) => opt.label.includes(input)"
                @change="handleProjectCompanyChange" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="EPC 公司">
              <a-input :value="projectProperty.epcCompany || ''" :placeholder="projectProperty.epcCompany ? '' : '根据项目公司配置自动带出'" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="产权公司" name="ownershipCompany"
              :rules="[{ required: true, message: '请选择产权公司' }]">
              <a-select v-model:value="projectProperty.ownershipCompany" :options="PROJECT_COMPANY_OPTIONS"
                style="width:100%" placeholder="请选择或搜索" show-search
                :filter-option="(input: string, opt: any) => opt.label.includes(input)" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
      </div>

    </a-card>

    <div ref="tabsWrapperRef" class="tabs-wrapper" :class="{ 'tabs-stuck': tabsStuck }">
      <a-tabs
        v-model:active-key="activeTab"
        class="form-tabs"
        :tab-bar-style="{ padding: tabsStuck ? '0 24px' : '8px 24px 0', marginBottom: 0 }"
        @change="handleTabChange"
        @tab-click="scrollToTabNav"
      >
        <!-- 勘察 TAB -->
        <a-tab-pane key="survey" tab="勘察" force-render>
          <a-form ref="surveyRef" :colon="false" :model="survey" layout="vertical" style="padding: 28px 0 12px">

            <!-- 项目总体概况 -->
            <div class="section-sub-title" style="margin-top:0">项目总体概况</div>
            <a-row :gutter="[24, 0]">
              <a-col :span="12">
                <a-form-item label="建筑数量" name="buildingCount"
                  :rules="[{ required: true, message: '请输入建筑数量' }]">
                  <a-input-number v-model:value="survey.buildingCount" :min="0" :precision="0"
                    style="width:50%" addon-after="个" placeholder="0" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="屋面类型" name="roofLightSteel"
                  :rules="[{ required: true, validator: (_: any) => (survey.roofLightSteel != null || survey.roofConcrete != null || survey.roofOther != null) ? Promise.resolve() : Promise.reject('请填写屋面类型数量') }]">
                  <a-space :size="16" wrap>
                    <span class="roof-type-label">轻钢结构屋面</span>
                    <a-input-number v-model:value="survey.roofLightSteel" :min="0" :precision="0"
                      style="width:100px" addon-after="个" placeholder="0" />
                    <span class="roof-type-label">混凝土屋面</span>
                    <a-input-number v-model:value="survey.roofConcrete" :min="0" :precision="0"
                      style="width:100px" addon-after="个" placeholder="0" />
                    <span class="roof-type-label">其他</span>
                    <a-input-number v-model:value="survey.roofOther" :min="0" :precision="0"
                      style="width:100px" addon-after="个" placeholder="0" />
                  </a-space>
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="[24, 0]">
              <a-col :span="12">
                <a-form-item name="siteLayoutFiles"
                  :rules="[{ required: true, validator: (_: any, v: any[]) => v?.length ? Promise.resolve() : Promise.reject('请上传总平面布置图') }]">
                  <template #label>总平面布置图<a-tooltip title="支持 PDF / JPG / PNG 等格式，最多10个"><QuestionCircleOutlined class="upload-hint-icon" /></a-tooltip></template>
                  <FileUploadField v-model:file-list="survey.siteLayoutFiles" :max-count="10" accept=".pdf,.jpg,.jpeg,.png" multiple>
                    <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
                  </FileUploadField>
                </a-form-item>
              </a-col>
            </a-row>

            <a-divider />
            <!-- 每个建筑的屋面情况 -->
            <div class="section-sub-title" style="margin-top:0">每个建筑的屋面情况</div>
            <a-row :gutter="[24, 0]">
              <a-col :span="12">
                <a-form-item label="彩钢瓦瓦型" name="steelRoofType"
                  :rules="[{ required: true, message: '请选择彩钢瓦瓦型' }]">
                  <div class="seg-ctrl">
                    <span class="seg-item" :class="{ active: survey.steelRoofType === 'standing_seam' }"
                      @click="survey.steelRoofType = 'standing_seam'">直立锁边型</span>
                    <span class="seg-item" :class="{ active: survey.steelRoofType === 'angle_drive' }"
                      @click="survey.steelRoofType = 'angle_drive'">角驰型</span>
                    <span class="seg-item" :class="{ active: survey.steelRoofType === 'trapezoidal' }"
                      @click="survey.steelRoofType = 'trapezoidal'">梯型</span>
                  </div>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="瓦面锈蚀情况" name="rustCondition"
                  :rules="[{ required: true, message: '请选择瓦面锈蚀情况' }]">
                  <div class="seg-ctrl">
                    <span class="seg-item" :class="{ active: survey.rustCondition === 'none' }"
                      @click="survey.rustCondition = 'none'">无锈蚀</span>
                    <span class="seg-item" :class="{ active: survey.rustCondition === 'light' }"
                      @click="survey.rustCondition = 'light'">局部轻度锈蚀</span>
                    <span class="seg-item" :class="{ active: survey.rustCondition === 'severe' }"
                      @click="survey.rustCondition = 'severe'">严重锈蚀</span>
                  </div>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="屋面是否有障碍物" name="hasObstacle"
                  :rules="[{ required: true, message: '请选择是否有障碍物' }]">
                  <a-space :size="16" align="center" wrap>
                    <div class="seg-ctrl">
                      <span class="seg-item" :class="{ active: survey.hasObstacle === 'yes' }"
                        @click="survey.hasObstacle = 'yes'">有</span>
                      <span class="seg-item" :class="{ active: survey.hasObstacle === 'no' }"
                        @click="survey.hasObstacle = 'no'">无</span>
                    </div>
                    <template v-if="survey.hasObstacle === 'yes'">
                      <span class="cond-label">高</span>
                      <a-input-number v-model:value="survey.obstacleHeight" :min="0" :precision="2"
                        style="width:110px" addon-after="m" placeholder="0.00" />
                      <span class="cond-label">宽</span>
                      <a-input-number v-model:value="survey.obstacleWidth" :min="0" :precision="2"
                        style="width:110px" addon-after="m" placeholder="0.00" />
                    </template>
                  </a-space>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="屋面是否有采光带" name="hasSkylight"
                  :rules="[{ required: true, message: '请选择是否有采光带' }]">
                  <a-space :size="16" align="center" wrap>
                    <div class="seg-ctrl">
                      <span class="seg-item" :class="{ active: survey.hasSkylight === 'yes' }"
                        @click="survey.hasSkylight = 'yes'">有</span>
                      <span class="seg-item" :class="{ active: survey.hasSkylight === 'no' }"
                        @click="survey.hasSkylight = 'no'">无</span>
                    </div>
                    <template v-if="survey.hasSkylight === 'yes'">
                      <span class="cond-label">采光带宽度</span>
                      <a-input-number v-model:value="survey.skylightWidth" :min="0" :precision="0"
                        style="width:120px" addon-after="mm" placeholder="0" />
                    </template>
                  </a-space>
                </a-form-item>
              </a-col>
            </a-row>

            <a-divider />
            <!-- 用户配电情况 -->
            <div class="section-sub-title" style="margin-top:0">用户配电情况</div>
            <a-row :gutter="[24, 0]">
              <a-col :span="12">
                <a-form-item label="进线电压等级" name="inletVoltage"
                  :rules="[{ required: true, message: '请输入进线电压等级' }]">
                  <a-input-number v-model:value="survey.inletVoltage" :min="0" :precision="1"
                    style="width:50%" addon-after="kV" placeholder="0.0" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="用户进线接入方式" name="inletConnectionType"
                  :rules="[{ required: true, message: '请选择接入方式' }]">
                  <div class="seg-ctrl">
                    <span class="seg-item" :class="{ active: survey.inletConnectionType === 'dedicated' }"
                      @click="survey.inletConnectionType = 'dedicated'">专线接入</span>
                    <span class="seg-item" :class="{ active: survey.inletConnectionType === 'tee' }"
                      @click="survey.inletConnectionType = 'tee'">T接接入</span>
                  </div>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="进线回路" name="circuitCount"
                  :rules="[{ required: true, message: '请填写进线回路信息' }]">
                  <a-space :size="16" align="center" wrap>
                    <span class="cond-label">进线回路数</span>
                    <a-input-number v-model:value="survey.circuitCount" :min="0" :precision="0"
                      style="width:110px" addon-after="回" placeholder="0" />
                    <span class="cond-label">进线电缆规格</span>
                    <a-input-number v-model:value="survey.cableSpec" :min="0" :precision="0"
                      style="width:120px" addon-after="mm²" placeholder="0" />
                  </a-space>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="用户变压器信息" name="transformerCount"
                  :rules="[{ required: true, message: '请填写变压器信息' }]">
                  <a-space :size="16" align="center" wrap>
                    <span class="cond-label">配置</span>
                    <a-input-number v-model:value="survey.transformerCount" :min="0" :precision="0"
                      style="width:100px" addon-after="台" placeholder="0" />
                    <span class="cond-label">共</span>
                    <a-input-number v-model:value="survey.transformerKVA" :min="0" :precision="0"
                      style="width:120px" addon-after="kVA" placeholder="0" />
                  </a-space>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="是否具备接入间隔" name="hasInterval"
                  :rules="[{ required: true, message: '请选择是否具备接入间隔' }]">
                  <div class="seg-ctrl">
                    <span class="seg-item" :class="{ active: survey.hasInterval === 'yes' }"
                      @click="survey.hasInterval = 'yes'">有，需落实备用间隔是否可给光伏</span>
                    <span class="seg-item" :class="{ active: survey.hasInterval === 'space' }"
                      @click="survey.hasInterval = 'space'">无，但有安装间隔的空间</span>
                    <span class="seg-item" :class="{ active: survey.hasInterval === 'no' }"
                      @click="survey.hasInterval = 'no'">无</span>
                  </div>
                </a-form-item>
              </a-col>
            </a-row>

            <a-divider />
            <!-- 光伏设备放置及布线条件 -->
            <div class="section-sub-title" style="margin-top:0">光伏设备放置及布线条件</div>
            <a-row :gutter="[24, 0]">
              <a-col :span="12">
                <a-form-item label="光伏设备放置条件" name="hasIndoorSpace"
                  :rules="[{ required: true, message: '请选择放置条件' }]">
                  <a-space :size="16" align="center" wrap>
                    <div class="seg-ctrl">
                      <span class="seg-item" :class="{ active: survey.hasIndoorSpace === 'no' }"
                        @click="survey.hasIndoorSpace = 'no'">无室内放置空间</span>
                      <span class="seg-item" :class="{ active: survey.hasIndoorSpace === 'yes' }"
                        @click="survey.hasIndoorSpace = 'yes'">有</span>
                    </div>
                    <template v-if="survey.hasIndoorSpace === 'yes'">
                      <span class="cond-label">长</span>
                      <a-input-number v-model:value="survey.indoorLength" :min="0" :precision="1"
                        style="width:110px" addon-after="m" placeholder="0.0" />
                      <span class="cond-label">宽</span>
                      <a-input-number v-model:value="survey.indoorWidth" :min="0" :precision="1"
                        style="width:110px" addon-after="m" placeholder="0.0" />
                    </template>
                  </a-space>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="场内电缆管道情况" name="hasCablePipe"
                  :rules="[{ required: true, message: '请选择电缆管道情况' }]">
                  <a-space direction="vertical" :size="8">
                    <div class="seg-ctrl">
                      <span class="seg-item" :class="{ active: survey.hasCablePipe === 'yes' }"
                        @click="survey.hasCablePipe = 'yes'">有</span>
                      <span class="seg-item" :class="{ active: survey.hasCablePipe === 'no_green' }"
                        @click="survey.hasCablePipe = 'no_green'; survey.cablePipeType = null">无，有绿化带可直埋</span>
                      <span class="seg-item" :class="{ active: survey.hasCablePipe === 'no_road' }"
                        @click="survey.hasCablePipe = 'no_road'; survey.cablePipeType = null">无，需破场内硬化道路</span>
                    </div>
                    <div v-if="survey.hasCablePipe === 'yes'" class="seg-ctrl" style="margin-left:2px">
                      <span class="seg-item" :class="{ active: survey.cablePipeType === 'trench' }"
                        @click="survey.cablePipeType = 'trench'">电缆沟</span>
                      <span class="seg-item" :class="{ active: survey.cablePipeType === 'conduit' }"
                        @click="survey.cablePipeType = 'conduit'">电缆排管</span>
                      <span class="seg-item" :class="{ active: survey.cablePipeType === 'other' }"
                        @click="survey.cablePipeType = 'other'">其它</span>
                    </div>
                  </a-space>
                </a-form-item>
              </a-col>
            </a-row>

            <a-divider />
            <!-- 勘察照片 -->
            <div class="section-sub-title" style="margin-top:0">勘察照片<span class="sub-hint">每类最多 10 张</span></div>
            <a-row :gutter="[24, 0]">
              <a-col v-for="cat in SURVEY_PHOTO_CATS" :key="cat.key" :span="12">
                <a-form-item :label="cat.label" :name="cat.key"
                  :rules="[{ required: true, validator: (_: any, v: any[]) => v?.length ? Promise.resolve() : Promise.reject(`请上传${cat.label}`) }]">
                  <a-upload v-model:file-list="(survey as any)[cat.key]" list-type="picture-card"
                    :max-count="10" :custom-request="noopRequest" accept="image/*" multiple>
                    <div v-if="((survey as any)[cat.key]?.length ?? 0) < 10" class="upload-trigger">
                      <PlusOutlined /><div style="margin-top:4px;font-size:12px">上传</div>
                    </div>
                  </a-upload>
                </a-form-item>
              </a-col>
            </a-row>

            <a-divider />
            <!-- 项目图纸及用电情况 -->
            <div class="section-sub-title" style="margin-top:0">项目图纸及用电情况</div>
            <a-row :gutter="[24, 0]">
              <a-col :span="12">
                <a-form-item name="drawingFiles"
                  :rules="[{ required: true, validator: (_: any, v: any[]) => v?.length ? Promise.resolve() : Promise.reject('请上传图纸') }]">
                  <template #label>图纸<a-tooltip title="支持 PDF / JPG / PNG / DWG，最多10个"><QuestionCircleOutlined class="upload-hint-icon" /></a-tooltip></template>
                  <FileUploadField v-model:file-list="survey.drawingFiles" :max-count="10" accept=".pdf,.jpg,.jpeg,.png,.dwg" multiple>
                    <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
                  </FileUploadField>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item name="electricityFiles"
                  :rules="[{ required: true, validator: (_: any, v: any[]) => v?.length ? Promise.resolve() : Promise.reject('请上传用电情况文件') }]">
                  <template #label>用电情况<a-tooltip title="支持 PDF / JPG / PNG，最多10个"><QuestionCircleOutlined class="upload-hint-icon" /></a-tooltip></template>
                  <FileUploadField v-model:file-list="survey.electricityFiles" :max-count="10" accept=".pdf,.jpg,.jpeg,.png" multiple>
                    <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
                  </FileUploadField>
                </a-form-item>
              </a-col>
            </a-row>

            <a-divider />
            <!-- 接入批复 -->
            <div class="section-sub-title" style="margin-top:0">接入批复</div>
            <a-row :gutter="[24, 0]">
              <a-col :span="12">
                <a-form-item name="approvalFiles"
                  :rules="[{ required: true, validator: (_: any, v: any[]) => v?.length ? Promise.resolve() : Promise.reject('请上传接入批复文件') }]">
                  <template #label>接入批复<a-tooltip title="支持 PDF / JPG / PNG，最多10个"><QuestionCircleOutlined class="upload-hint-icon" /></a-tooltip></template>
                  <FileUploadField v-model:file-list="survey.approvalFiles" :max-count="10" accept=".pdf,.jpg,.jpeg,.png" multiple>
                    <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
                  </FileUploadField>
                </a-form-item>
              </a-col>
            </a-row>

          </a-form>
        </a-tab-pane>

        <!-- 设计 TAB -->
        <a-tab-pane key="design" tab="设计" force-render>
          <a-form :colon="false" :model="design" layout="vertical" style="padding: 28px 0 12px">

            <!-- 甲供 BOM -->
            <div class="section-header" style="margin-bottom:12px">
              <span class="section-sub-title" style="margin:0">甲供 BOM</span>
              <a-space size="small">
                <a-button size="small" @click="message.success('模版已下载')">下载模版</a-button>
                <a-upload :before-upload="handleBomImport" :custom-request="noopRequest" :show-upload-list="false" accept=".xlsx,.xls">
                  <a-button size="small">批量导入</a-button>
                </a-upload>
                <a-button size="small" @click="openMaterialModal('jiagong')">
                  <template #icon><PlusOutlined /></template>添加物料
                </a-button>
              </a-space>
            </div>
            <a-table :columns="jiagongBomColumns" :data-source="design.jiagongBom" :pagination="false"
              size="small" :scroll="{ x: 'max-content' }" :locale="{ emptyText: '暂未添加甲供物料，点击「添加物料」选择' }">
              <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'quantity'">
                  <a-input-number v-model:value="record.quantity" :min="1" :precision="0" style="width:100px" />
                </template>
                <template v-if="column.key === 'action'">
                  <a-button type="text" danger size="small" @click="removeBomRow('jiagong', index)">删除</a-button>
                </template>
              </template>
            </a-table>

            <!-- 乙供中高/低压 BOM -->
            <div class="section-header" style="margin:32px 0 12px">
              <span class="section-sub-title" style="margin:0">乙供中高/低压 BOM</span>
              <a-space size="small">
                <a-button size="small" @click="message.success('模版已下载')">下载模版</a-button>
                <a-upload :before-upload="handleBomImport" :custom-request="noopRequest" :show-upload-list="false" accept=".xlsx,.xls">
                  <a-button size="small">批量导入</a-button>
                </a-upload>
                <a-button size="small" @click="openMaterialModal('yigong')">
                  <template #icon><PlusOutlined /></template>添加物料
                </a-button>
              </a-space>
            </div>
            <a-table :columns="bomColumns" :data-source="design.yigongBom" :pagination="false"
              size="small" :scroll="{ x: 'max-content' }" :locale="{ emptyText: '暂未添加乙供中/低压物料，点击「添加物料」选择' }">
              <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'quantity'">
                  <a-input-number v-model:value="record.quantity" :min="1" :precision="0" style="width:100px" />
                </template>
                <template v-if="column.key === 'action'">
                  <a-button type="text" danger size="small" @click="removeBomRow('yigong', index)">删除</a-button>
                </template>
              </template>
            </a-table>

            <!-- 上网模式 -->
            <div class="section-sub-title" style="margin:32px 0 20px">上网模式</div>
            <a-row :gutter="[24, 0]">
              <a-col :span="12">
                <a-form-item label="上网模式" name="gridMode" :rules="[{ required: true, message: '请选择上网模式' }]">
                  <div class="seg-ctrl">
                    <span v-for="opt in GRID_MODE_OPTIONS" :key="opt.value" class="seg-item"
                      :class="{ active: design.gridMode === opt.value }"
                      @click="design.gridMode = opt.value">{{ opt.label }}</span>
                  </div>
                </a-form-item>
              </a-col>
            </a-row>

            <!-- 应用场景 -->
            <a-divider />
            <div class="section-header" style="align-items:flex-start;margin-bottom:8px">
              <div>
                <div class="section-sub-title" style="margin:0 0 20px">应用场景</div>
                <div style="font-size:14px;color:rgba(0,0,0,0.65)">
                  应用场景是否混装：{{ design.scenes.length > 1 ? '是' : '否' }}
                </div>
              </div>
              <a-button v-if="design.scenes.length < SCENE_TYPES.length" size="small" @click="addScene">
                <template #icon><PlusOutlined /></template>增加应用场景
              </a-button>
            </div>
            <a-table :columns="sceneColumns" :data-source="design.scenes" :pagination="false"
              size="small" :row-key="(_: any, idx: number) => idx">
              <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'type'">
                  <a-select v-model:value="record.type" style="width:100%" placeholder="选择场景">
                    <a-select-option v-for="t in SCENE_TYPES" :key="t" :value="t"
                      :disabled="design.scenes.some((s: any, i: number) => i !== index && s.type === t)">{{ t }}</a-select-option>
                  </a-select>
                </template>
                <template v-if="column.key === 'blocks'">
                  <a-input-number v-model:value="record.blocks" :min="1" :precision="0" style="width:100%" placeholder="0" />
                </template>
                <template v-if="column.key === 'tiltAngle'">
                  <a-input-number v-model:value="record.tiltAngle" :min="0" :max="60" :precision="0"
                    style="width:100%" addon-after="°" placeholder="0" />
                </template>
                <template v-if="column.key === 'specialPlan'">
                  <a-select v-model:value="record.specialPlan" style="width:100%" placeholder="选择特殊方案" allow-clear>
                    <a-select-option v-for="opt in SPECIAL_PLAN_OPTIONS" :key="opt" :value="opt">{{ opt }}</a-select-option>
                  </a-select>
                </template>
                <template v-if="column.key === 'action'">
                  <a-button v-if="design.scenes.length > 1" type="link" danger size="small" @click="removeScene(index)">删除</a-button>
                </template>
              </template>
            </a-table>
            <div class="scene-blocks-hint" :class="{ error: !sceneBlocksMatch && jiagongComponentQty > 0 }">
              <span>场景块数合计：<b>{{ totalSceneBlocks }}</b> 块</span>
              <span>甲供 BOM 组件总量：<b>{{ jiagongComponentQty }}</b> 块</span>
              <span v-if="jiagongComponentQty > 0 && !sceneBlocksMatch" class="hint-error">
                ⚠ 块数合计须等于甲供 BOM 组件总量
              </span>
            </div>

            <!-- 设计附件 -->
            <a-divider style="margin-top:20px" />
            <div class="section-sub-title" style="margin-top:0">设计附件</div>
            <a-row :gutter="[24, 0]">
              <a-col :span="12">
                <a-form-item name="designQualFiles"
                  :rules="[{ required: true, validator: (_: any, v: any[]) => v?.length ? Promise.resolve() : Promise.reject('请上传设计资质') }]">
                  <template #label>设计资质<a-tooltip title="支持 PDF / Word / 图片，最多10个，≤ 200M"><QuestionCircleOutlined class="upload-hint-icon" /></a-tooltip></template>
                  <FileUploadField v-model:file-list="design.designQualFiles" :max-count="10" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" multiple>
                    <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
                  </FileUploadField>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item name="electricalDesignFiles"
                  :rules="[{ required: true, validator: (_: any, v: any[]) => v?.length ? Promise.resolve() : Promise.reject('请上传电气设计图') }]">
                  <template #label>电气设计图<a-tooltip title="支持 PDF / Word / DWG / 图片，最多10个，≤ 200M"><QuestionCircleOutlined class="upload-hint-icon" /></a-tooltip></template>
                  <FileUploadField v-model:file-list="design.electricalDesignFiles" :max-count="10" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.dwg" multiple>
                    <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
                  </FileUploadField>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item name="structuralDesignFiles"
                  :rules="[{ required: true, validator: (_: any, v: any[]) => v?.length ? Promise.resolve() : Promise.reject('请上传结构设计图') }]">
                  <template #label>结构设计图<a-tooltip title="支持 PDF / Word / DWG / 图片，最多10个，≤ 200M"><QuestionCircleOutlined class="upload-hint-icon" /></a-tooltip></template>
                  <FileUploadField v-model:file-list="design.structuralDesignFiles" :max-count="10" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.dwg" multiple>
                    <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
                  </FileUploadField>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item name="safetyAssessFiles"
                  :rules="[{ required: true, validator: (_: any, v: any[]) => v?.length ? Promise.resolve() : Promise.reject('请上传厂房结构安全性评估') }]">
                  <template #label>厂房结构安全性评估<a-tooltip title="支持 PDF / Word / 图片，最多10个，≤ 200M"><QuestionCircleOutlined class="upload-hint-icon" /></a-tooltip></template>
                  <FileUploadField v-model:file-list="design.safetyAssessFiles" :max-count="10" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" multiple>
                    <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
                  </FileUploadField>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item>
                  <template #label>其他附件<a-tooltip title="支持 PDF / Word / 图片，最多10个，≤ 200M"><QuestionCircleOutlined class="upload-hint-icon" /></a-tooltip></template>
                  <FileUploadField v-model:file-list="design.otherAttachFiles" :max-count="10" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" multiple>
                    <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
                  </FileUploadField>
                </a-form-item>
              </a-col>
            </a-row>

          </a-form>
        </a-tab-pane>

        <!-- 商务 TAB -->
        <a-tab-pane key="commercial" tab="商务" force-render>
          <a-form :colon="false" :model="commercial" layout="vertical" style="padding: 28px 0 12px">

            <!-- 合同信息 header -->
            <div class="section-header" style="margin-bottom:16px">
              <div class="section-sub-title" style="margin:0">合同信息</div>
              <a-button size="small" @click="addOtherContract">
                <template #icon><PlusOutlined /></template>添加其他合同
              </a-button>
            </div>

            <!-- EMC 协议 -->
            <div class="contract-block">
              <div class="contract-block-header">EMC协议（能源管理合同）</div>
              <div class="contract-block-body">
                <a-row :gutter="[24, 0]">
                  <a-col :span="8">
                    <a-form-item label="合同编号" :rules="[{ required: true, message: '请输入合同编号' }, { max: 50, message: '最多50字' }]">
                      <a-input v-model:value="commercial.emcContract.contractNo" placeholder="请输入" :maxlength="50" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="合同款项类别" :rules="[{ required: true, message: '请选择合同款项类别' }]">
                      <a-select v-model:value="commercial.emcContract.paymentCategory" placeholder="请选择" style="width:100%">
                        <a-select-option v-for="c in PAYMENT_CATEGORIES" :key="c" :value="c">{{ c }}</a-select-option>
                      </a-select>
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="甲方" :rules="[{ required: true, message: '请选择甲方' }]">
                      <a-select v-model:value="commercial.emcContract.partyA" show-search placeholder="请选择或搜索" style="width:100%" :options="SUPPLIER_OPTIONS" :filter-option="(input: string, opt: any) => opt.label.includes(input)" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="乙方" :rules="[{ required: true, message: '请选择乙方' }]">
                      <a-select v-model:value="commercial.emcContract.partyB" show-search placeholder="请选择或搜索" style="width:100%" :options="PROJECT_COMPANY_OPTIONS" :filter-option="(input: string, opt: any) => opt.label.includes(input)" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="合同签订金额" :rules="[{ required: true, message: '请输入合同签订金额' }]">
                      <a-input-number v-model:value="commercial.emcContract.amount" :precision="2" :min="0" style="width:100%" placeholder="请输入" addon-after="元" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="合同签订日期" :rules="[{ required: true, message: '请选择合同签订日期' }]">
                      <a-date-picker v-model:value="commercial.emcContract.signDate" style="width:100%" placeholder="请输入" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="备注">
                      <a-input v-model:value="commercial.emcContract.remark" placeholder="请输入" :maxlength="500" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="合同附件" :rules="[{ required: true, validator: (_: any, v: any[]) => v?.length ? Promise.resolve() : Promise.reject('请上传合同附件') }]">
                      <FileUploadField v-model:file-list="commercial.emcContract.files" :max-count="10" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" multiple>
                        <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
                      </FileUploadField>
                    </a-form-item>
                  </a-col>
                </a-row>
              </div>
            </div>

            <!-- 小E施工承包合同 -->
            <div class="contract-block">
              <div class="contract-block-header">小E施工承包合同（常规EMC）</div>
              <div class="contract-block-body">
                <a-row :gutter="[24, 0]">
                  <a-col :span="8">
                    <a-form-item label="合同编号" :rules="[{ max: 50, message: '最多50字' }]">
                      <a-input v-model:value="commercial.smallEContract.contractNo" placeholder="请输入" :maxlength="50" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="合同款项类别">
                      <a-select v-model:value="commercial.smallEContract.paymentCategory" placeholder="请选择" style="width:100%">
                        <a-select-option v-for="c in PAYMENT_CATEGORIES" :key="c" :value="c">{{ c }}</a-select-option>
                      </a-select>
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="甲方">
                      <a-select v-model:value="commercial.smallEContract.partyA" show-search placeholder="请选择或搜索" style="width:100%" :options="PROJECT_COMPANY_OPTIONS" :filter-option="(input: string, opt: any) => opt.label.includes(input)" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="乙方">
                      <a-select v-model:value="commercial.smallEContract.partyB" show-search placeholder="请选择或搜索" style="width:100%" :options="SUPPLIER_OPTIONS" :filter-option="(input: string, opt: any) => opt.label.includes(input)" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="合同签订金额">
                      <a-input-number v-model:value="commercial.smallEContract.amount" :precision="2" :min="0" style="width:100%" placeholder="请输入" addon-after="元" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="合同签订日期">
                      <a-date-picker v-model:value="commercial.smallEContract.signDate" style="width:100%" placeholder="请输入" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="备注">
                      <a-input v-model:value="commercial.smallEContract.remark" placeholder="请输入" :maxlength="500" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="合同附件">
                      <FileUploadField v-model:file-list="commercial.smallEContract.files" :max-count="10" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" multiple>
                        <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
                      </FileUploadField>
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="实控人姓名" :rules="[{ max: 50, message: '最多50字' }]">
                      <a-input v-model:value="commercial.smallEContract.controllerName" placeholder="请输入" :maxlength="50" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="实控人身份证号" :rules="[{ max: 18, message: '最多18字' }]">
                      <a-input v-model:value="commercial.smallEContract.controllerIdCard" placeholder="请输入" :maxlength="18" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="实控人配偶姓名" :rules="[{ max: 50, message: '最多50字' }]">
                      <a-input v-model:value="commercial.smallEContract.controllerSpouseName" placeholder="请输入" :maxlength="50" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="实控人配偶身份证号" :rules="[{ max: 18, message: '最多18字' }]">
                      <a-input v-model:value="commercial.smallEContract.controllerSpouseIdCard" placeholder="请输入" :maxlength="18" />
                    </a-form-item>
                  </a-col>
                </a-row>
              </div>
            </div>

            <!-- 设计合同 -->
            <div class="contract-block">
              <div class="contract-block-header">设计合同</div>
              <div class="contract-block-body">
                <a-row :gutter="[24, 0]">
                  <a-col :span="8">
                    <a-form-item label="合同编号" :rules="[{ max: 50, message: '最多50字' }]">
                      <a-input v-model:value="commercial.designContract.contractNo" placeholder="请输入" :maxlength="50" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="合同款项类别">
                      <a-select v-model:value="commercial.designContract.paymentCategory" placeholder="请选择" style="width:100%">
                        <a-select-option v-for="c in PAYMENT_CATEGORIES" :key="c" :value="c">{{ c }}</a-select-option>
                      </a-select>
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="甲方">
                      <a-select v-model:value="commercial.designContract.partyA" show-search placeholder="请选择或搜索" style="width:100%" :options="PROJECT_COMPANY_OPTIONS" :filter-option="(input: string, opt: any) => opt.label.includes(input)" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="乙方">
                      <a-select v-model:value="commercial.designContract.partyB" show-search placeholder="请选择或搜索" style="width:100%" :options="SUPPLIER_OPTIONS" :filter-option="(input: string, opt: any) => opt.label.includes(input)" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="合同签订金额">
                      <a-input-number v-model:value="commercial.designContract.amount" :precision="2" :min="0" style="width:100%" placeholder="请输入" addon-after="元" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="合同签订日期">
                      <a-date-picker v-model:value="commercial.designContract.signDate" style="width:100%" placeholder="请输入" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="备注">
                      <a-input v-model:value="commercial.designContract.remark" placeholder="请输入" :maxlength="500" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="合同附件">
                      <FileUploadField v-model:file-list="commercial.designContract.files" :max-count="10" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" multiple>
                        <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
                      </FileUploadField>
                    </a-form-item>
                  </a-col>
                </a-row>
              </div>
            </div>

            <!-- 监理合同 -->
            <div class="contract-block">
              <div class="contract-block-header">监理合同</div>
              <div class="contract-block-body">
                <a-row :gutter="[24, 0]">
                  <a-col :span="8">
                    <a-form-item label="合同编号" :rules="[{ max: 50, message: '最多50字' }]">
                      <a-input v-model:value="commercial.jianliContract.contractNo" placeholder="请输入" :maxlength="50" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="合同款项类别">
                      <a-select v-model:value="commercial.jianliContract.paymentCategory" placeholder="请选择" style="width:100%">
                        <a-select-option v-for="c in PAYMENT_CATEGORIES" :key="c" :value="c">{{ c }}</a-select-option>
                      </a-select>
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="甲方">
                      <a-select v-model:value="commercial.jianliContract.partyA" show-search placeholder="请选择或搜索" style="width:100%" :options="PROJECT_COMPANY_OPTIONS" :filter-option="(input: string, opt: any) => opt.label.includes(input)" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="乙方">
                      <a-select v-model:value="commercial.jianliContract.partyB" show-search placeholder="请选择或搜索" style="width:100%" :options="SUPPLIER_OPTIONS" :filter-option="(input: string, opt: any) => opt.label.includes(input)" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="合同签订金额">
                      <a-input-number v-model:value="commercial.jianliContract.amount" :precision="2" :min="0" style="width:100%" placeholder="请输入" addon-after="元" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="合同签订日期">
                      <a-date-picker v-model:value="commercial.jianliContract.signDate" style="width:100%" placeholder="请输入" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="备注">
                      <a-input v-model:value="commercial.jianliContract.remark" placeholder="请输入" :maxlength="500" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="合同附件">
                      <FileUploadField v-model:file-list="commercial.jianliContract.files" :max-count="10" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" multiple>
                        <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
                      </FileUploadField>
                    </a-form-item>
                  </a-col>
                </a-row>
              </div>
            </div>

            <!-- 其他合同（动态） -->
            <div v-for="(contract, idx) in commercial.otherContracts" :key="idx" class="contract-block">
              <div class="contract-block-header">
                其他合同{{ idx + 1 }}
                <a-button type="text" danger size="small" style="margin-left:auto" @click="removeOtherContract(idx)">删除</a-button>
              </div>
              <div class="contract-block-body">
                <a-row :gutter="[24, 0]">
                  <a-col :span="8">
                    <a-form-item label="合同编号" :rules="[{ max: 50, message: '最多50字' }]">
                      <a-input v-model:value="contract.contractNo" placeholder="请输入" :maxlength="50" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="合同款项类别">
                      <a-select v-model:value="contract.paymentCategory" placeholder="请选择" style="width:100%">
                        <a-select-option v-for="c in PAYMENT_CATEGORIES" :key="c" :value="c">{{ c }}</a-select-option>
                      </a-select>
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="甲方" :rules="[{ max: 50, message: '最多50字' }]">
                      <a-input v-model:value="contract.partyA" placeholder="请输入" :maxlength="50" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="乙方" :rules="[{ max: 50, message: '最多50字' }]">
                      <a-input v-model:value="contract.partyB" placeholder="请输入" :maxlength="50" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="合同签订金额">
                      <a-input-number v-model:value="contract.amount" :precision="2" :min="0" style="width:100%" placeholder="请输入" addon-after="元" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="合同签订日期">
                      <a-date-picker v-model:value="contract.signDate" style="width:100%" placeholder="请输入" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="备注">
                      <a-input v-model:value="contract.remark" placeholder="请输入" :maxlength="500" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="8">
                    <a-form-item label="合同附件">
                      <FileUploadField v-model:file-list="contract.files" :max-count="10" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" multiple>
                        <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
                      </FileUploadField>
                    </a-form-item>
                  </a-col>
                </a-row>
              </div>
            </div>

          </a-form>
        </a-tab-pane>

        <!-- 备案 TAB -->
        <a-tab-pane key="record" tab="备案" force-render>
          <div style="padding: 28px 0 12px">
            <div class="section-sub-title" style="margin-top:0">备案证关联</div>
            <template v-if="design.gridMode === 'offgrid'">
              <a-alert message="上网模式为「离网」时无需关联备案证" type="info" show-icon />
            </template>
            <template v-else>
              <template v-if="!record.filingCert">
                <div class="filing-cert-empty">
                  <a-empty description="暂未关联备案证">
                    <a-button type="primary" @click="openFilingCertModal">关联</a-button>
                  </a-empty>
                </div>
              </template>
              <template v-else>
                <div class="filing-cert-card">
                  <div class="cert-info-grid">
                    <div class="cert-info-item">
                      <span class="cert-info-label">备案证文件名</span>
                      <span class="cert-info-value">{{ record.filingCert.fileName }}</span>
                    </div>
                    <div class="cert-info-item">
                      <span class="cert-info-label">备案类型</span>
                      <span class="cert-info-value">{{ record.filingCert.filingType }}</span>
                    </div>
                    <div class="cert-info-item">
                      <span class="cert-info-label">备案证项目名称</span>
                      <span class="cert-info-value">{{ record.filingCert.projectName }}</span>
                    </div>
                    <div class="cert-info-item">
                      <span class="cert-info-label">备案证项目代码</span>
                      <span class="cert-info-value">{{ record.filingCert.projectCode }}</span>
                    </div>
                    <div class="cert-info-item">
                      <span class="cert-info-label">产权公司</span>
                      <span class="cert-info-value">{{ record.filingCert.ownershipCompany }}</span>
                    </div>
                    <div class="cert-info-item">
                      <span class="cert-info-label">备案证编号</span>
                      <span class="cert-info-value">{{ record.filingCert.certNo }}</span>
                    </div>
                    <div class="cert-info-item">
                      <span class="cert-info-label">备案证容量(W)</span>
                      <span class="cert-info-value">{{ record.filingCert.capacity }}</span>
                    </div>
                    <div class="cert-info-item">
                      <span class="cert-info-label">备案证类型</span>
                      <span class="cert-info-value">{{ record.filingCert.certType }}</span>
                    </div>
                    <div class="cert-info-item">
                      <span class="cert-info-label">备案证批复时间</span>
                      <span class="cert-info-value">{{ record.filingCert.approvalDate }}</span>
                    </div>
                    <div class="cert-info-item">
                      <span class="cert-info-label">发文机关</span>
                      <span class="cert-info-value">{{ record.filingCert.issuingAuthority }}</span>
                    </div>
                    <div class="cert-info-item cert-info-item--span2">
                      <span class="cert-info-label">备案证批复内容</span>
                      <span class="cert-info-value">{{ record.filingCert.approvalContent }}</span>
                    </div>
                    <div class="cert-info-item cert-info-item--span2">
                      <span class="cert-info-label">备案证附件</span>
                      <FileAttachmentView v-if="record.filingCert.attachmentName" :files="[record.filingCert.attachmentName]" />
                      <span v-else class="cert-info-value">—</span>
                    </div>
                  </div>
                  <a-space style="margin-top:16px">
                    <a-button @click="openFilingCertModal">更换备案证</a-button>
                    <a-button danger @click="clearFilingCert">取消关联</a-button>
                  </a-space>
                </div>
              </template>
            </template>
          </div>
        </a-tab-pane>

      </a-tabs>
    </div>

    </div><!-- /filing-body -->

    <!-- 备案证弹窗 -->
    <a-modal v-model:open="certModalVisible" title="关联备案证" :width="960" :footer="null" destroy-on-close>
      <div style="margin-bottom:4px">
        <a-input-search v-model:value="certSearch" placeholder="按项目代码 / 项目名称 / 备案证编号搜索" style="width:100%" />
      </div>
      <a-table :columns="certColumns" :data-source="certList" :pagination="{ pageSize: 6 }"
        size="small" row-key="certNo" :scroll="{ x: 860 }" style="margin-top:12px">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-button type="link" size="small" @click="selectCert(record)">关联</a-button>
          </template>
        </template>
      </a-table>
    </a-modal>

    <!-- 物料弹窗 -->
    <a-modal v-model:open="materialModalVisible" :title="materialModalTitle" :width="720"
      destroy-on-close @ok="confirmMaterial">
      <a-input-search v-model:value="materialSearch" placeholder="按物料编码 / 名称搜索"
        style="width:100%;margin-bottom:12px" />
      <a-table :columns="activeMaterialColumns" :data-source="activeMaterialList" :pagination="{ pageSize: 8 }"
        size="small" :row-selection="{ selectedRowKeys: selectedMaterialKeys, onChange: onMaterialSelect }"
        row-key="code">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'confirmQty'">
            <a-input-number v-model:value="record.confirmQty" :min="1" :precision="0"
              style="width:90px" placeholder="数量" />
          </template>
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import FileUploadField from '../components/FileUploadField.vue'
import FileAttachmentView from '../components/FileAttachmentView.vue'

const props = defineProps<{
  editId?: string | null
  initStatus?: string | null
  initData?: {
    projectType:   'emc' | 'public_emc'
    policyMatched: boolean
    region:        string[]
    projectName:   string
    oaNo:          string
  } | null
}>()
const emit = defineEmits<{ back: [] }>()

const isEdit = computed(() => !!props.editId)
import {
  LeftOutlined, PlusOutlined, MinusCircleOutlined, UploadOutlined, QuestionCircleOutlined, DownOutlined,
} from '@ant-design/icons-vue'

const REGION_OPTIONS = [
  {
    value: '浙江省', label: '浙江省', children: [
      { value: '杭州市', label: '杭州市', children: [
        { value: '滨江区', label: '滨江区', children: [
          { value: '长河街道', label: '长河街道' }, { value: '西兴街道', label: '西兴街道' },
          { value: '浦沿街道', label: '浦沿街道' },
        ]},
        { value: '余杭区', label: '余杭区', children: [
          { value: '临平街道', label: '临平街道' }, { value: '余杭街道', label: '余杭街道' },
          { value: '仁和街道', label: '仁和街道' }, { value: '良渚街道', label: '良渚街道' },
        ]},
        { value: '萧山区', label: '萧山区', children: [
          { value: '城厢街道', label: '城厢街道' }, { value: '北干街道', label: '北干街道' },
          { value: '益农镇', label: '益农镇' }, { value: '河上镇', label: '河上镇' },
        ]},
        { value: '西湖区', label: '西湖区', children: [
          { value: '北山街道', label: '北山街道' }, { value: '西溪街道', label: '西溪街道' },
          { value: '转塘街道', label: '转塘街道' },
        ]},
      ]},
      { value: '宁波市', label: '宁波市', children: [
        { value: '鄞州区', label: '鄞州区', children: [
          { value: '首南街道', label: '首南街道' }, { value: '钟公庙街道', label: '钟公庙街道' },
          { value: '咸祥镇', label: '咸祥镇' }, { value: '姜山镇', label: '姜山镇' },
        ]},
        { value: '江北区', label: '江北区', children: [
          { value: '中马街道', label: '中马街道' }, { value: '文教街道', label: '文教街道' },
          { value: '慈城镇', label: '慈城镇' },
        ]},
        { value: '北仑区', label: '北仑区', children: [
          { value: '新碶街道', label: '新碶街道' }, { value: '大碶街道', label: '大碶街道' },
          { value: '柴桥街道', label: '柴桥街道' }, { value: '白峰镇', label: '白峰镇' },
        ]},
      ]},
      { value: '温州市', label: '温州市', children: [
        { value: '鹿城区', label: '鹿城区', children: [
          { value: '五马街道', label: '五马街道' }, { value: '蒲鞋市街道', label: '蒲鞋市街道' },
          { value: '山福镇', label: '山福镇' },
        ]},
        { value: '瓯海区', label: '瓯海区', children: [
          { value: '娄桥街道', label: '娄桥街道' }, { value: '梧田街道', label: '梧田街道' },
          { value: '泽雅镇', label: '泽雅镇' },
        ]},
      ]},
    ],
  },
  {
    value: '江苏省', label: '江苏省', children: [
      { value: '苏州市', label: '苏州市', children: [
        { value: '工业园区', label: '工业园区', children: [
          { value: '娄葑街道', label: '娄葑街道' }, { value: '唯亭街道', label: '唯亭街道' },
          { value: '胜浦街道', label: '胜浦街道' },
        ]},
        { value: '吴中区', label: '吴中区', children: [
          { value: '长桥街道', label: '长桥街道' }, { value: '甪直镇', label: '甪直镇' },
          { value: '木渎镇', label: '木渎镇' }, { value: '东山镇', label: '东山镇' },
        ]},
        { value: '相城区', label: '相城区', children: [
          { value: '元和街道', label: '元和街道' }, { value: '太平街道', label: '太平街道' },
          { value: '黄埭镇', label: '黄埭镇' },
        ]},
      ]},
      { value: '南京市', label: '南京市', children: [
        { value: '江宁区', label: '江宁区', children: [
          { value: '东山街道', label: '东山街道' }, { value: '江宁街道', label: '江宁街道' },
          { value: '湖熟街道', label: '湖熟街道' }, { value: '横溪街道', label: '横溪街道' },
        ]},
        { value: '栖霞区', label: '栖霞区', children: [
          { value: '仙林街道', label: '仙林街道' }, { value: '马群街道', label: '马群街道' },
          { value: '燕子矶街道', label: '燕子矶街道' },
        ]},
      ]},
      { value: '无锡市', label: '无锡市', children: [
        { value: '惠山区', label: '惠山区', children: [
          { value: '洛社镇', label: '洛社镇' }, { value: '前洲街道', label: '前洲街道' },
          { value: '玉祁街道', label: '玉祁街道' },
        ]},
        { value: '新吴区', label: '新吴区', children: [
          { value: '旺庄街道', label: '旺庄街道' }, { value: '鸿山街道', label: '鸿山街道' },
          { value: '新安街道', label: '新安街道' },
        ]},
      ]},
    ],
  },
  {
    value: '上海市', label: '上海市', children: [
      { value: '上海市', label: '上海市', children: [
        { value: '松江区', label: '松江区', children: [
          { value: '岳阳街道', label: '岳阳街道' }, { value: '中山街道', label: '中山街道' },
          { value: '泗泾镇', label: '泗泾镇' }, { value: '新桥镇', label: '新桥镇' },
        ]},
        { value: '闵行区', label: '闵行区', children: [
          { value: '江川路街道', label: '江川路街道' }, { value: '古美路街道', label: '古美路街道' },
          { value: '浦锦街道', label: '浦锦街道' }, { value: '马桥镇', label: '马桥镇' },
        ]},
        { value: '奉贤区', label: '奉贤区', children: [
          { value: '南桥镇', label: '南桥镇' }, { value: '奉城镇', label: '奉城镇' },
          { value: '庄行镇', label: '庄行镇' },
        ]},
      ]},
    ],
  },
]

const STATUS_COLOR: Record<string, string> = {
  filing: 'processing', pending_review: 'processing', rejected: 'error',
}
const STATUS_LABEL: Record<string, string> = {
  filing: '建档中', pending_review: '建档审核中', rejected: '建档审核不通过',
}
const SURVEY_PHOTO_CATS = [
  { key: 'aerialPhotos',        label: '航拍图' },
  { key: 'roofPeripheryPhotos', label: '屋面周边照片' },
  { key: 'roofPhotos',          label: '屋面照片' },
  { key: 'houseFrontPhotos',    label: '房屋正面照片' },
  { key: 'factoryPhotos',       label: '厂房内部照片' },
]

const PROJECT_COMPANY_OPTIONS = [
  { value: 'hz_pv',   label: '杭州绿源光伏资产管理有限公司' },
  { value: 'nb_pv',   label: '宁波蓝天新能源股份有限公司' },
  { value: 'nj_pv',   label: '南京晴天绿色能源科技有限公司' },
  { value: 'sh_pv',   label: '上海启明光电资产有限公司' },
  { value: 'sz_pv',   label: '苏州联合光伏投资有限公司' },
  { value: 'cz_pv',   label: '常州鼎盛新能源管理有限公司' },
  { value: 'wz_pv',   label: '温州海澄光伏资产有限公司' },
  { value: 'jx_pv',   label: '嘉兴浩天清洁能源有限公司' },
  { value: 'hf_pv',   label: '合肥瑞阳光伏资产运营有限公司' },
  { value: 'wx_pv',   label: '无锡华诚新能源股份有限公司' },
]

const DEVELOPER_OPTIONS = [
  { value: '杭州绿源光伏开发有限公司',   label: '杭州绿源光伏开发有限公司' },
  { value: '宁波蓝天新能源开发有限公司', label: '宁波蓝天新能源开发有限公司' },
  { value: '苏州晴天能源开发有限公司',   label: '苏州晴天能源开发有限公司' },
  { value: '南京阳光科技开发有限公司',   label: '南京阳光科技开发有限公司' },
  { value: '无锡联合新能源开发有限公司', label: '无锡联合新能源开发有限公司' },
  { value: '常州鼎盛光伏投资有限公司',   label: '常州鼎盛光伏投资有限公司' },
  { value: '温州海澄能源开发有限公司',   label: '温州海澄能源开发有限公司' },
  { value: '嘉兴浩天新能源有限公司',     label: '嘉兴浩天新能源有限公司' },
  { value: '上海启明光电开发有限公司',   label: '上海启明光电开发有限公司' },
  { value: '合肥瑞阳能源开发有限公司',   label: '合肥瑞阳能源开发有限公司' },
]
const CONSTRUCTOR_OPTIONS = [
  { value: '杭州宏基建设工程有限公司',   label: '杭州宏基建设工程有限公司' },
  { value: '宁波兴达建筑工程有限公司',   label: '宁波兴达建筑工程有限公司' },
  { value: '苏州博远机电工程有限公司',   label: '苏州博远机电工程有限公司' },
  { value: '南京天宇建设工程有限公司',   label: '南京天宇建设工程有限公司' },
  { value: '无锡华诚建设集团有限公司',   label: '无锡华诚建设集团有限公司' },
  { value: '常州鑫源建筑工程有限公司',   label: '常州鑫源建筑工程有限公司' },
  { value: '温州龙腾建设有限公司',       label: '温州龙腾建设有限公司' },
  { value: '嘉兴东方建工集团有限公司',   label: '嘉兴东方建工集团有限公司' },
  { value: '上海瑞建工程技术有限公司',   label: '上海瑞建工程技术有限公司' },
  { value: '合肥中建机电安装有限公司',   label: '合肥中建机电安装有限公司' },
]

const STANDARD_PAYMENT_NODES = [
  { key: 'start',    label: '开工款',    pct: 30, desc: '开工验收后 15 个工作日内到账' },
  { key: 'grid',     label: '并网款',    pct: 30, desc: '并网验收后 15 个工作日内到账' },
  { key: 'complete', label: '竣工验收款', pct: 30, desc: '竣工验收后 15 个工作日内到账' },
  { key: 'warranty', label: '质保金',    pct: 10, desc: '质保期满后 30 个工作日内到账' },
]

const filingStatus = ref<string | null>(props.initStatus ?? null)
watch(() => props.initStatus, (val) => { if (val != null) filingStatus.value = val })
const rejectInfo = reactive({
  stage: '建档审核', reviewer: '李四（审核员）',
  time: '2026-08-11 15:30', reason: 'EMC 电价填写有误，当前区域标准电价为 0.6200 元/kWh，请核实后重新提交。',
})
const projectInfoOpen = ref(true)
const saving       = ref(false)
const submitting   = ref(false)
const canVoid = computed(() =>
  filingStatus.value != null && ['filing', 'rejected'].includes(filingStatus.value)
)

const projectInfoRef = ref()
const projectInfo = reactive({
  stationType: '工商业', stationNo: '',
  projectName:     props.initData?.projectName ?? '',
  projectType:     (props.initData?.projectType ?? 'emc') as 'emc' | 'public_emc',
  policyMatched:   props.initData?.policyMatched ?? true,
  division:        '安能智电事业部',
  regionCompany:   '安能智电事业部',
  addressRegion:   props.initData?.region ?? [] as string[],
  addressDetail:   '',
  capacity:        null as number | null,
  gridVoltage:     null as string | null,
  agentName:       '浙江绿能科技有限公司',
  userEntName:     '',
  propertyProof:   [] as any[],
  bizLicense:      [] as any[],
  developerName:   '', constructorName: '', supervisorName: '', designerName: '',
  emcPrice:        null as number | null,
  emcYears:        null as number | null,
  consumptionRate: null as number | null,
  publicBuildType: null as string | null,
  bankAccountCert: [] as any[],
  idCardFront:     [] as any[],
  idCardBack:      [] as any[],
})

const projectPropertyRef = ref()
const projectProperty = reactive({
  projectCompany:   null as string | null,
  epcCompany:       '',
  ownershipCompany: null as string | null,
})
const EPC_MAP: Record<string, string> = {
  hz_pv: '杭州绿源工程技术有限公司',
  nb_pv: '宁波蓝天建设工程有限公司',
  nj_pv: '南京晴天机电工程有限公司',
  sh_pv: '上海启明建筑工程有限公司',
  sz_pv: '苏州联合机电安装有限公司',
  cz_pv: '常州鼎盛建设集团有限公司',
  wz_pv: '温州海澄工程技术有限公司',
  jx_pv: '嘉兴浩天建设工程有限公司',
  hf_pv: '合肥瑞阳机电安装有限公司',
  wx_pv: '无锡华诚建筑工程有限公司',
}
const handleProjectCompanyChange = (val: string) => {
  projectProperty.epcCompany = EPC_MAP[val] ?? ''
}

const surveyRef = ref()
const survey = reactive({
  // 项目总体概况
  siteLayoutFiles:       [] as any[],
  buildingCount:         null as number | null,
  roofLightSteel:        null as number | null,
  roofConcrete:          null as number | null,
  roofOther:             null as number | null,
  // 屋面情况
  steelRoofType:         null as string | null,
  rustCondition:         null as string | null,
  hasObstacle:           null as string | null,
  obstacleHeight:        null as number | null,
  obstacleWidth:         null as number | null,
  hasSkylight:           null as string | null,
  skylightWidth:         null as number | null,
  // 用户配电情况
  inletVoltage:          null as number | null,
  inletConnectionType:   null as string | null,
  circuitCount:          null as number | null,
  cableSpec:             null as number | null,
  transformerCount:      null as number | null,
  transformerKVA:        null as number | null,
  hasInterval:           null as string | null,
  // 光伏设备放置及布线
  hasIndoorSpace:        null as string | null,
  indoorLength:          null as number | null,
  indoorWidth:           null as number | null,
  hasCablePipe:          null as string | null,
  cablePipeType:         null as string | null,
  // 勘察照片
  aerialPhotos:          [] as any[],
  roofPeripheryPhotos:   [] as any[],
  roofPhotos:            [] as any[],
  houseFrontPhotos:      [] as any[],
  factoryPhotos:         [] as any[],
  // 图纸及用电情况
  drawingFiles:          [] as any[],
  electricityFiles:      [] as any[],
  // 接入批复
  approvalFiles:         [] as any[],
})

const SCENE_TYPES = ['彩钢瓦', '阵列式', '阳光房']
const SPECIAL_PLAN_OPTIONS = ['车棚', 'BIPV', '光伏幕墙']
const GRID_MODE_OPTIONS = [
  { value: 'full_grid', label: '全额上网' },
  { value: 'surplus',   label: '余电上网' },
  { value: 'no_surplus', label: '余电不上网' },
  { value: 'offgrid',   label: '离网' },
]

const design = reactive({
  jiagongBom:  [] as any[],
  yigongBom:   [] as any[],
  gridMode:   null as string | null,
  scenes: [{ type: null as string | null, blocks: null as number | null, tiltAngle: null as number | null, specialPlan: null as string | null }] as { type: string | null, blocks: number | null, tiltAngle: number | null, specialPlan: string | null }[],
  designQualFiles:      [] as any[],
  electricalDesignFiles: [] as any[],
  structuralDesignFiles: [] as any[],
  safetyAssessFiles:    [] as any[],
  otherAttachFiles:     [] as any[],
})
const addScene = () => { if (design.scenes.length < SCENE_TYPES.length) design.scenes.push({ type: null, blocks: null, tiltAngle: null, specialPlan: null }) }
const removeScene = (idx: number) => { if (design.scenes.length > 1) design.scenes.splice(idx, 1) }
const jiagongComponentQty = computed(() =>
  design.jiagongBom
    .filter((m: any) => m.group === '组件')
    .reduce((sum: number, m: any) => sum + (m.quantity || 0), 0)
)
const totalSceneBlocks = computed(() =>
  design.scenes.reduce((sum, s) => sum + (s.blocks || 0), 0)
)
const sceneBlocksMatch = computed(() =>
  jiagongComponentQty.value > 0 && totalSceneBlocks.value === jiagongComponentQty.value
)

const sceneColumns = [
  { title: '序号',       key: 'index',       width: 60,  customRender: ({ index }: { index: number }) => index + 1 },
  { title: '*应用场景',  key: 'type',        width: 160 },
  { title: '*应用场景块数', key: 'blocks',   width: 140 },
  { title: '*倾角',      key: 'tiltAngle',   width: 130 },
  { title: '特殊方案',   key: 'specialPlan', width: 160 },
  { title: '操作',       key: 'action',      width: 70 },
]

const bomColumns = [
  { title: '序号',     key: 'index',      width: 60,  customRender: ({ index }: { index: number }) => index + 1 },
  { title: '类型',     dataIndex: 'type', key: 'type' },
  { title: '物料编号', dataIndex: 'code', key: 'code' },
  { title: '物料描述', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '单位',     dataIndex: 'unit', key: 'unit' },
  { title: '确认数量', key: 'quantity',   width: 130, fixed: 'right' },
  { title: '操作',     key: 'action',     width: 80,  fixed: 'right' },
]
const jiagongBomColumns = [
  { title: '序号',     key: 'index',          width: 60,  customRender: ({ index }: { index: number }) => index + 1 },
  { title: '物料编码', dataIndex: 'code',     key: 'code' },
  { title: '物料名称', dataIndex: 'name',     key: 'name', ellipsis: true },
  { title: '物料组',   dataIndex: 'group',    key: 'group' },
  { title: '单位',     dataIndex: 'unit',     key: 'unit' },
  { title: 'BOM类型',  key: 'bomType',        customRender: () => '电器BOM' },
  { title: '确认数量', key: 'quantity',       width: 130, fixed: 'right' },
  { title: '操作',     key: 'action',         width: 80,  fixed: 'right' },
]
const noopRequest = ({ onSuccess }: any) => { setTimeout(() => onSuccess?.('ok'), 0) }
const removeBomRow = (type: 'jiagong' | 'yigong', idx: number) => {
  const map = { jiagong: 'jiagongBom', yigong: 'yigongBom' } as const
  design[map[type]].splice(idx, 1)
}
const handleBomImport = (file: any) => { message.info(`导入文件：${file.name}`); return false }

const PAYMENT_CATEGORIES = ['应收款项', '应付款项']
const SUPPLIER_OPTIONS = [
  { value: '浙江正泰新能源开发有限公司', label: '浙江正泰新能源开发有限公司' },
  { value: '浙江某甲供应商有限公司',     label: '浙江某甲供应商有限公司' },
  { value: '杭州某能源集团有限公司',     label: '杭州某能源集团有限公司' },
]
const commercial = reactive({
  emcContract: {
    contractNo: '', paymentCategory: null as string | null,
    partyA: '', partyB: '', amount: null as number | null, signDate: null as any, remark: '', files: [] as any[],
  },
  smallEContract: {
    contractNo: '', paymentCategory: null as string | null,
    partyA: '正泰安能数字能源（浙江）股份有限公司', partyB: '',
    amount: null as number | null, signDate: null as any, remark: '', files: [] as any[],
    controllerName: '', controllerIdCard: '', controllerSpouseName: '', controllerSpouseIdCard: '',
  },
  designContract: {
    contractNo: '', paymentCategory: null as string | null,
    partyA: '正泰安能数字能源（浙江）股份有限公司', partyB: '',
    amount: null as number | null, signDate: null as any, remark: '', files: [] as any[],
  },
  jianliContract: {
    contractNo: '', paymentCategory: null as string | null,
    partyA: '', partyB: '',
    amount: null as number | null, signDate: null as any, remark: '', files: [] as any[],
  },
  otherContracts: [] as {
    contractNo: string, paymentCategory: string | null,
    partyA: string, partyB: string, amount: number | null,
    signDate: any, remark: string, files: any[],
  }[],
})
const addOtherContract = () => {
  commercial.otherContracts.push({ contractNo: '', paymentCategory: null, partyA: '', partyB: '', amount: null, signDate: null, remark: '', files: [] })
}
const removeOtherContract = (idx: number) => { commercial.otherContracts.splice(idx, 1) }

const record = reactive({ filingCert: null as any })
const certModalVisible = ref(false)
const certSearch = ref('')
const certList = [
  {
    fileName: '杭州滨江综合体光伏备案证',
    projectCode: 'PJ-2026-0001', projectName: '杭州市滨江区某商业综合体光伏项目',
    certNo: 'BC-2026-0001', capacity: 320000, availableCapacity: 120000, certType: '分布式光伏',
    ownershipCompany: '杭州光伏资产管理有限公司', filingType: '备案',
    issuingAuthority: '杭州市滨江区发展和改革局',
    approvalDate: '2026-03-15', approvalContent: '同意该项目在滨江区××路×号商业综合体楼顶建设分布式光伏发电项目，装机容量320kW，接入10kV电网。',
    attachmentName: '杭州滨江综合体光伏备案批复文件.pdf',
  },
  {
    fileName: '宁波鄞州厂房光伏备案证',
    projectCode: 'PJ-2026-0002', projectName: '宁波鄞州某工业厂房屋顶光伏项目',
    certNo: 'BC-2026-0002', capacity: 500000, availableCapacity: 500000, certType: '分布式光伏',
    ownershipCompany: '宁波新能源股份有限公司', filingType: '备案',
    issuingAuthority: '宁波市鄞州区发展和改革局',
    approvalDate: '2026-04-08', approvalContent: '同意在鄞州区某工业厂房屋顶建设分布式光伏发电项目，装机容量500kW，采用余电上网模式。',
    attachmentName: '宁波鄞州厂房光伏备案批复文件.pdf',
  },
  {
    fileName: '苏州园区光伏备案证',
    projectCode: 'PJ-2026-0003', projectName: '苏州工业园区某园区光伏项目',
    certNo: 'BC-2026-0003', capacity: 800000, availableCapacity: 300000, certType: '工商业光伏',
    ownershipCompany: '苏州联合光伏投资有限公司', filingType: '核准',
    issuingAuthority: '苏州工业园区管理委员会',
    approvalDate: '2026-05-20', approvalContent: '核准苏州工业园区某园区建设工商业光伏发电项目，装机容量800kW，并网电压等级10kV，全额上网。',
    attachmentName: '苏州园区光伏核准批复文件.pdf',
  },
]
const certColumns = [
  { title: '备案证项目代码',       dataIndex: 'projectCode',       key: 'projectCode',       width: 140 },
  { title: '备案证项目名称',       dataIndex: 'projectName',       key: 'projectName',       ellipsis: true },
  { title: '备案证编号',           dataIndex: 'certNo',            key: 'certNo',            width: 130 },
  { title: '备案容量(W)',          dataIndex: 'capacity',          key: 'capacity',          width: 110 },
  { title: '并网剩余可用容量(W)',  dataIndex: 'availableCapacity', key: 'availableCapacity', width: 150 },
  { title: '备案证类型',           dataIndex: 'certType',          key: 'certType',          width: 110 },
  { title: '操作',                 key: 'action',                  width: 70 },
]
const openFilingCertModal = () => { certSearch.value = ''; certModalVisible.value = true }
const selectCert = (cert: any) => { record.filingCert = cert; certModalVisible.value = false }
const clearFilingCert = () => { record.filingCert = null }

const materialModalVisible = ref(false)
const materialModalTitle = ref('')
const materialSearch       = ref('')
const currentBomType = ref<'jiagong' | 'yigong'>('jiagong')
const selectedMaterialKeys = ref<string[]>([])
const jiagongMaterialList = [
  { code: 'M001', name: '单晶硅光伏组件 545W', group: '组件',   unit: '块', confirmQty: null },
  { code: 'M002', name: '组串式逆变器 50kW',   group: '逆变器', unit: '台', confirmQty: null },
  { code: 'M003', name: '铝合金固定支架',       group: '支架',   unit: '套', confirmQty: null },
  { code: 'M004', name: '并网计量电表箱',       group: '电表箱', unit: '个', confirmQty: null },
]
const yigongMaterialList = [
  { code: 'TB0002', name: '400kVA柱上变压器',          unit: '台',  category: '中高压', subCategory: '变压器', confirmQty: null },
  { code: 'XB0001', name: '600kVA干变',                unit: '台',  category: '中高压', subCategory: '变压器', confirmQty: null },
  { code: 'TJ0080', name: '台架变',                    unit: '台',  category: '低压',   subCategory: '接线端子', confirmQty: null },
  { code: '100009', name: '台架变压器',                unit: '台',  category: '中高压', subCategory: '变压器', confirmQty: null },
  { code: '100005', name: '宁德时代100度磷酸铁锂储能电池', unit: 'PCS', category: '中高压', subCategory: '储能',  confirmQty: null },
]
const jiagongMaterialColumns = [
  { title: '物料编码', dataIndex: 'code',  key: 'code',         width: 110 },
  { title: '物料名称', dataIndex: 'name',  key: 'name',         ellipsis: true },
  { title: '物料组',   dataIndex: 'group', key: 'group',        width: 90 },
  { title: '单位',     dataIndex: 'unit',  key: 'unit',         width: 60 },
  { title: 'BOM类型',  key: 'bomType',     width: 90,  customRender: () => '电器BOM' },
  { title: '确认数量', key: 'confirmQty',  width: 110 },
]
const yigongMaterialColumns = [
  { title: '材料编号', dataIndex: 'code',        key: 'code',        width: 110 },
  { title: '材料名称', dataIndex: 'name',        key: 'name',        ellipsis: true },
  { title: '单位',     dataIndex: 'unit',        key: 'unit',        width: 70 },
  { title: '材料大类', dataIndex: 'category',    key: 'category',    width: 90 },
  { title: '二级分类', dataIndex: 'subCategory', key: 'subCategory', width: 100 },
  { title: '确认数量', key: 'confirmQty',        width: 110 },
]
const activeMaterialColumns = computed(() =>
  currentBomType.value === 'jiagong' ? jiagongMaterialColumns : yigongMaterialColumns
)
const activeMaterialList = computed(() =>
  currentBomType.value === 'jiagong' ? jiagongMaterialList : yigongMaterialList
)
const openMaterialModal = (type: 'jiagong' | 'yigong') => {
  currentBomType.value = type
  materialModalTitle.value = type === 'jiagong' ? '甲供物料选择' : '乙供中/低压物料选择'
  selectedMaterialKeys.value = []
  materialModalVisible.value = true
}
const onMaterialSelect = (keys: string[]) => { selectedMaterialKeys.value = keys }
const confirmMaterial = () => {
  const list = activeMaterialList.value
  const selected = list.filter((m: any) => selectedMaterialKeys.value.includes(m.code))
  if (selected.some((m: any) => !m.confirmQty)) { message.error('请填写所有已选物料的确认数量'); return }
  const map = { jiagong: 'jiagongBom', yigong: 'yigongBom' } as const
  const target = design[map[currentBomType.value]]
  if (currentBomType.value === 'jiagong') {
    selected.forEach((m: any) => { if (!target.find((r: any) => r.code === m.code)) target.push({ ...m, quantity: m.confirmQty }) })
  } else {
    selected.forEach((m: any) => { if (!target.find((r: any) => r.code === m.code)) target.push({ code: m.code, name: m.name, type: m.category, unit: m.unit, quantity: m.confirmQty }) })
  }
  materialModalVisible.value = false
}

const activeTab = ref('survey')
const handleTabChange = (_key: string) => {}

const filingBodyRef  = ref<HTMLElement | null>(null)
const tabsWrapperRef = ref<HTMLElement | null>(null)
const tabsStuck      = ref(false)
const scrollPad      = ref(0)

async function scrollToTabNav() {
  await nextTick()
  const body    = filingBodyRef.value
  const wrapper = tabsWrapperRef.value
  if (!body || !wrapper) return
  tabsStuck.value = true
  await nextTick()
  const target = Math.round(
    wrapper.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop
  )
  const naturalScrollHeight = body.scrollHeight - scrollPad.value
  const neededPad = Math.max(0, target - naturalScrollHeight + body.clientHeight + 20)
  if (neededPad !== scrollPad.value) {
    scrollPad.value = neededPad
    await nextTick()
  }
  body.scrollTop = target
}

let _scrollHandler: (() => void) | null = null

const handleBack   = () => emit('back')
const handleSave   = async () => {
  saving.value = true
  try { await saveFilingDraft(buildPayload()); message.success('保存成功'); filingStatus.value = 'filing' }
  catch { message.error('保存失败，请重试') } finally { saving.value = false }
}
const handleSubmit = async () => {
  const surveyValid = await surveyRef.value?.validate().catch(() => false)
  if (!surveyValid) { message.error('勘察信息填写不完整'); activeTab.value = 'survey'; return }
  if (design.gridMode !== 'offgrid' && !record.filingCert) { message.error('请先关联备案证'); activeTab.value = 'record'; return }
  submitting.value = true
  try { await submitFiling(buildPayload()); message.success('提交成功，等待审核'); emit('back') }
  catch { message.error('提交失败，请重试') } finally { submitting.value = false }
}
const handleVoid = async () => {
  try { await voidFiling(); message.success('已作废') }
  catch { message.error('作废失败，请重试') }
}

const buildPayload = () => ({
  ...projectInfo, ...projectProperty,
  oaNo: props.initData?.oaNo ?? '',
  ...survey,
  bom: { jiagong: design.jiagongBom, yigong: design.yigongBom },
  commercial, filingCertNo: record.filingCert?.certNo ?? null,
})

onMounted(async () => {
  const body = filingBodyRef.value
  if (body) {
    _scrollHandler = () => {
      const wrapper = tabsWrapperRef.value
      if (!wrapper) return
      tabsStuck.value = wrapper.getBoundingClientRect().top <= body.getBoundingClientRect().top + 1
      if (!tabsStuck.value && body.scrollTop <= 1) scrollPad.value = 0
    }
    body.addEventListener('scroll', _scrollHandler, { passive: true })
  }

  if (!props.editId) return
  const data = await fetchFilingDetail(props.editId)
  Object.assign(projectInfo, {
    projectName: data.projectName, projectType: data.projectType,
    addressDetail: data.addressDetail, addressRegion: data.region ?? [],
    capacity: data.capacity, gridVoltage: data.gridVoltage, emcPrice: data.emcPrice,
  })
  Object.assign(survey, { gridMode: data.gridMode, ownerName: data.ownerName, ownerPhone: data.ownerPhone, scenes: data.scenes })
  design.jiagongBom = data.jiagongBom; design.yigongBom = data.yigongBom
  commercial.emcContract = data.emcContract
  record.filingCert = data.filingCert
  filingStatus.value = data.filingStatus
  if (data.filingStatus === 'rejected' && data.rejectInfo) {
    Object.assign(rejectInfo, data.rejectInfo)
  }
})

onUnmounted(() => {
  if (_scrollHandler) filingBodyRef.value?.removeEventListener('scroll', _scrollHandler)
})

async function saveFilingDraft(_payload: any): Promise<void> {}
async function submitFiling(_payload: any): Promise<void> {}
async function voidFiling(): Promise<void> {}
async function fetchFilingDetail(_id: string) {
  return {
    filingStatus: props.initStatus ?? 'filing', region: ['浙江省', '杭州市', '滨江区'],
    projectName: '杭州市滨江区某商业综合体光伏项目', projectType: 'emc',
    addressDetail: '××路×号商业综合体楼顶', capacity: 320, gridVoltage: 'low',
    gridMode: 'surplus', ownerName: '张三', ownerPhone: '13800138000',
    scenes: [
      { type: '彩钢瓦', blocks: 10, tiltAngle: 20, specialPlan: '车棚' },
      { type: '阳光房', blocks: 15, tiltAngle: 30, specialPlan: 'BIPV' },
    ],
    jiagongBom: [
      { code: 'M001', name: '单晶硅光伏组件 545W', group: '组件',   unit: '块', quantity: 560 },
      { code: 'M002', name: '组串式逆变器 50kW',   group: '逆变器', unit: '台', quantity: 8 },
    ],
    yigongBom: [
      { code: 'TB0002', name: '400kVA柱上变压器', type: '中高压', unit: '台',  quantity: 2 },
      { code: 'TJ0080', name: '台架变',           type: '低压',   unit: '台',  quantity: 1 },
    ],
    emcContract: 'EMC-2026-0001', emcPrice: 0.6500,
    rejectInfo: {
      stage: '建档审核', reviewer: '李四（审核员）',
      time: '2026-08-11 15:30', reason: 'EMC 电价填写有误，当前区域标准电价为 0.6200 元/kWh，请核实后重新提交。',
    },
    filingCert: {
      fileName: '杭州滨江综合体光伏备案证',
      projectCode: 'PJ-2026-0001', projectName: '杭州市滨江区某商业综合体光伏项目',
      certNo: 'BC-2026-0001', capacity: 320000, availableCapacity: 120000, certType: '分布式光伏',
      ownershipCompany: '杭州光伏资产管理有限公司', filingType: '备案',
      issuingAuthority: '杭州市滨江区发展和改革局',
      approvalDate: '2026-03-15', approvalContent: '同意该项目在滨江区××路×号商业综合体楼顶建设分布式光伏发电项目，装机容量320kW，接入10kV电网。',
      attachmentName: '杭州滨江综合体光伏备案批复文件.pdf',
    },
  }
}
</script>

<style scoped>
.filing-page {
  height: calc(100vh - 81px);
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* ── 固定顶栏 ── */
.filing-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 160px;
  padding: 0 24px;
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.filing-header-left { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; overflow: hidden; }
.filing-header-left :deep(.ant-tag) { flex-shrink: 0; margin-inline-end: 0; }
.back-btn { color: #595959; flex-shrink: 0; }
.filing-title { font-size: 16px; font-weight: 600; margin-left: 4px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 1; }

/* ── 摘要条 ── */
.filing-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 0;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 6px;
  padding: 10px 16px;
  font-size: 13px;
  color: #555;
  margin-bottom: 20px;
}
.filing-summary-item { display: flex; align-items: center; }
.filing-summary-item strong { color: #1a1a1a; margin-left: 2px; }
.filing-summary-divider { width: 1px; height: 14px; background: #d9d9d9; margin: 0 14px; }

/* ── 退回原因卡片 ── */
.reject-card {
  border: 1px solid rgba(220,38,38,.25);
  border-left: 4px solid #dc2626;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
  margin: 16px 0 0;
}
.reject-card-header {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 16px 0;
  font-size: 15px; font-weight: 600; color: #dc2626;
}
.reject-card-body { padding: 8px 16px 12px; }
.reject-meta { display: flex; gap: 20px; font-size: 12px; color: #595959; margin-bottom: 8px; }
.reject-meta-item strong { color: #1a1a1a; }
.reject-reason { font-size: 13px; color: #1a1a1a; line-height: 1.6; }

/* ── 主卡片 ── */
.filing-body { flex: 1; overflow-y: auto; padding: 0 16px 16px; overscroll-behavior: contain; }
.main-card { margin-top: 16px; border-radius: 8px; }
.tabs-wrapper { background: #fff; border-radius: 8px; margin-top: 16px; }

/* ── 一级 Section 标题（对应回购页 section-title） ── */
.section-title--toggle { cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none; }
.section-title--collapsed { margin-bottom: 0 !important; }
.section-toggle-icon { font-size: 12px; color: #8c8c8c; background: #f0f0f0; padding: 7px 6px 5px; border-radius: 4px; display: inline-flex; align-items: center; transition: transform 0.2s; }
.section-toggle-icon.rotated { transform: rotate(-90deg); }
.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #000;
  margin-bottom: 16px;
}

/* ── 二级 Sub-section 标题 ── */
.section-sub-title {
  font-size: 16px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.88);
  margin: 20px 0 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-sub-title::before {
  content: '';
  width: 3px;
  height: 16px;
  background: #1677ff;
  border-radius: 2px;
  flex-shrink: 0;
}
.sub-hint {
  font-size: 12px;
  font-weight: 400;
  color: #8c8c8c;
}

/* ── Section header（标题 + 右侧按钮） ── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* ── 垂直 form-item 样式 ── */
:deep(.ant-form-item-label > label),
:deep(.ant-form-item-label > label.ant-form-item-required) {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  height: auto;
}
:deep(.ant-form-vertical .ant-form-item) {
  margin-bottom: 20px;
}


.img-upload-trigger { display: flex; flex-direction: column; align-items: center; justify-content: center; color: #8c8c8c; font-size: 20px; }
.id-card-upload :deep(.ant-upload.ant-upload-select-picture-card),
.id-card-upload :deep(.ant-upload-list-picture-card .ant-upload-list-item-container) { width: 150px !important; height: 100px !important; }
.upload-dragger-text { font-size: 14px; color: #262626; display: flex; align-items: center; gap: 4px; }
.upload-hint-icon { font-size: 13px; color: #8c8c8c; cursor: pointer; flex-shrink: 0; margin-left: 4px; }

/* ── 应用场景 ── */
.scene-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 4px; }
.scene-row  { display: flex; align-items: center; gap: 8px; }
.scene-blocks-hint { display: flex; align-items: center; gap: 16px; margin-top: 8px; font-size: 13px; color: rgba(0,0,0,0.65); }
.scene-blocks-hint b { color: rgba(0,0,0,0.88); }
.hint-error { color: #ff4d4f; }
.scene-index {
  width: 20px; height: 20px; background: #f0f0f0; border-radius: 50%;
  font-size: 11px; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; color: #595959;
}
.add-scene-btn { width: 200px; margin-top: 4px; }

/* ── 勘察辅助标签 ── */
.roof-type-label { font-size: 14px; color: rgba(0,0,0,0.88); white-space: nowrap; }
.cond-label      { font-size: 14px; color: rgba(0,0,0,0.65); white-space: nowrap; }

/* ── 勘察照片 ── */
.survey-photo-grid { display: flex; flex-direction: column; gap: 20px; }
.survey-photo-row  { }
.photo-upload-grid { display: flex; flex-direction: column; gap: 12px; }
.photo-upload-item { display: flex; align-items: flex-start; gap: 12px; }
.photo-cat-label { width: 72px; flex-shrink: 0; font-size: 14px; color: #595959; padding-top: 6px; }
.photo-upload-area { flex: 1; min-width: 0; }
.photo-upload-area :deep(.ant-upload-list) { display: flex; flex-wrap: wrap; }
.photo-upload-area :deep(.ant-upload-select),
.photo-upload-area :deep(.ant-upload-list-item-container),
.photo-upload-area :deep(.ant-upload-list-item) { width: 80px !important; height: 80px !important; }
.upload-trigger {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #8c8c8c; font-size: 20px;
}
.upload-trigger-dash { font-size: 18px; color: rgba(0,0,0,0.25); line-height: 1; }

/* ── 付款节点 ── */
.contract-block { border: 1px solid #f0f0f0; border-radius: 6px; margin-bottom: 16px; overflow: hidden; }
.contract-block-header { display: flex; align-items: center; background: #f5f5f5; padding: 8px 16px; font-size: 14px; font-weight: 500; color: rgba(0,0,0,0.88); }
.contract-block-body { padding: 20px 16px 4px; }
.contract-type-text { font-size: 14px; color: rgba(0,0,0,0.88); line-height: 32px; }

.payment-nodes { display: flex; gap: 10px; }
.payment-node-row {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 14px 16px;
  background: #fafafa; border: 1px solid #f0f0f0; border-radius: 6px;
  flex: 1; text-align: center;
}
.payment-node-label { font-size: 13px; font-weight: 500; }
.payment-node-pct   { font-size: 15px; font-weight: 600; color: #1677ff; }
.payment-node-desc  { font-size: 12px; color: #8c8c8c; line-height: 1.4; }

/* ── 备案证 ── */
.filing-cert-empty { padding: 32px 0; }
.filing-cert-card  { padding: 4px 0; }
.cert-info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.cert-info-item { display: flex; flex-direction: column; min-width: 0; }
.cert-info-item--span2 { grid-column: span 2; }
.cert-info-item--span4 { grid-column: span 4; }
.cert-info-label {
  font-size: 14px; color: rgba(0,0,0,0.45);
  line-height: 22px; padding-bottom: 8px; white-space: nowrap;
}
.cert-info-value {
  font-size: 14px; color: rgba(0,0,0,0.88);
  line-height: 22px; word-break: break-word;
}
.cert-attachment-link {
  color: #1677ff;
  text-decoration: none;
  display: inline-flex; align-items: center;
  &:hover { color: #4096ff; text-decoration: underline; }
}

/* ── 自绘 Radio ── */
.seg-ctrl  { display: inline-flex; align-items: center; gap: 20px; }
.seg-item  { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; color: #262626; cursor: pointer; user-select: none; }
.seg-item::before {
  content: ''; width: 14px; height: 14px; border-radius: 50%;
  border: 1.5px solid #d9d9d9; background: #fff; flex-shrink: 0;
  transition: border-color 0.15s; box-sizing: border-box;
}
.seg-item:hover::before  { border-color: #1677ff; }
.seg-item.active::before { border: 4px solid #1677ff; background: #fff; }

/* ── Tabs ── */
.form-tabs :deep(.ant-tabs-tab-btn) { font-size: 14px; }
.form-tabs :deep(.ant-tabs-nav) { position: sticky; top: 0; z-index: 9; background: #fff; border-radius: 8px 8px 0 0; }
.form-tabs :deep(.ant-tabs-content-holder) { padding: 0 20px; }
.tabs-stuck .form-tabs :deep(.ant-tabs-nav) { margin-left: -16px !important; margin-right: -16px !important; border-radius: 0; }

/* ── 勘察 tab 分割线 ── */
.form-tabs :deep(.ant-divider-horizontal) { margin: 0 0 20px; }


</style>

