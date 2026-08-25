<template>
  <div class="filing-page">
    <!-- 固定顶栏 -->
    <div class="filing-header">
      <div class="filing-header-left">
        <a-button type="text" class="back-btn" @click="handleBack">
          <template #icon><LeftOutlined /></template>
        </a-button>
        <a-tooltip :title="isEdit ? `修改建档-${oaData.projectName}` : '非标准政策建档'">
          <span class="filing-title">{{ isEdit ? `修改建档-${oaData.projectName}` : '非标准政策建档' }}</span>
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
        <a-button type="primary" :loading="submitting" @click="handleSubmit">提交建档</a-button>
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

      <!-- 摘要行 -->
      <div class="filing-summary">
        <span class="filing-summary-item">OA 单号：<strong>{{ oaData.oaNo }}</strong></span>
        <span class="filing-summary-divider" />
        <span class="filing-summary-item">项目类型：<strong>{{ oaData.projectType === 'public_emc' ? '公建 EMC' : '常规 EMC' }}</strong></span>
        <span class="filing-summary-divider" />
        <span class="filing-summary-item">政策匹配：<strong>非标政策</strong></span>
      </div>

      <!-- ── 项目信息 ── -->
      <div class="section-title section-title--toggle" :class="{ 'section-title--collapsed': !projectInfoOpen }" @click="projectInfoOpen = !projectInfoOpen">项目信息<DownOutlined class="section-toggle-icon" :class="{ rotated: !projectInfoOpen }" /></div>
      <div v-show="projectInfoOpen">
      <a-form ref="formRef" :colon="false" :model="form" layout="vertical">

        <!-- Row 1: OA编号 / 项目名称 / 项目类型 / 是否政策匹配 -->
        <a-row :gutter="[24, 0]">
          <a-col :span="6">
            <a-form-item label="OA 编号">
              <a-input :value="oaData.oaNo" disabled />
              <div class="oa-hint">来自 OA 系统，不可修改</div>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="项目名称">
              <a-input :value="oaData.projectName" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="项目类型">
              <a-input :value="oaData.projectType === 'public_emc' ? '公建 EMC' : '常规 EMC'" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="是否政策匹配">
              <a-input value="否" disabled />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- Row 2: 省市区(6) / 详细地址(12) / EMC年限(6) -->
        <a-row :gutter="[24, 0]">
          <a-col :span="6">
            <a-form-item label="项目地址（省/市/区）">
              <a-input :value="oaData.region.join(' / ')" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="项目地址（详细地址）" name="addressDetail" :rules="[{ required: true, message: '请填写详细地址' }]">
              <a-input v-model:value="form.addressDetail" placeholder="街道 / 楼栋 / 门牌号" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="EMC 年限">
              <a-input :value="oaData.emcYears + ' 年'" disabled />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- Row 3: 项目容量 / 并网电压等级 / 代理商名称 / 用电企业名称 -->
        <a-row :gutter="[24, 0]">
          <a-col :span="6">
            <a-form-item label="项目容量" name="capacity" :rules="[{ required: true, message: '请填写项目容量' }]">
              <a-input-number v-model:value="form.capacity" style="width:100%" :min="0" :precision="2" placeholder="0.00">
                <template #addonAfter>KW</template>
              </a-input-number>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="并网电压等级">
              <a-input :value="oaData.gridVoltage === 'low' ? '低压' : '中高压'" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="代理商名称">
              <a-input :value="oaData.agentName" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="用电企业名称">
              <a-input :value="oaData.enterpriseName" disabled />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- Row 4: 开发商名称 / 施工商名称 / EMC电价 / 消纳比例 -->
        <a-row :gutter="[24, 0]">
          <a-col :span="6">
            <a-form-item label="开发商名称" name="developerName" :rules="[{ required: true, message: '请填写开发商名称' }]">
              <a-input v-model:value="form.developerName" placeholder="请输入" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="施工商名称" name="contractorName" :rules="[{ required: true, message: '请填写施工商名称' }]">
              <a-input v-model:value="form.contractorName" placeholder="请输入" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="EMC 电价">
              <a-input-number :value="oaData.emcPrice" style="width:100%" disabled>
                <template #addonAfter>元/kWh</template>
              </a-input-number>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="消纳比例">
              <a-input-number :value="oaData.absorptionRatio" style="width:100%" disabled>
                <template #addonAfter>%</template>
              </a-input-number>
            </a-form-item>
          </a-col>
        </a-row>

        <!-- Row 5: 公建机构类型 -->
        <a-row :gutter="[24, 0]">
          <a-col :span="6">
            <a-form-item label="公建机构类型" name="publicBuildingType" :rules="[{ required: true, message: '请选择公建机构类型' }]">
              <a-select v-model:value="form.publicBuildingType" placeholder="请选择">
                <a-select-option value="edu">科教文体公建</a-select-option>
                <a-select-option value="medical">医疗卫生公建</a-select-option>
                <a-select-option value="gov">党政政务机构</a-select-option>
                <a-select-option value="law">执法监管机构</a-select-option>
                <a-select-option value="public">公益事业单位机构</a-select-option>
                <a-select-option value="other">其他</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <!-- Row 6: 产权证明(最后，span=12) -->
        <a-row :gutter="[24, 0]">
          <a-col :span="12">
            <a-form-item name="propertyFiles" :rules="[{ required: true, message: '请上传产权证明文件', validator: validatePropertyFiles }]">
              <template #label>
                产权证明
                <a-tooltip title="支持 PDF / JPG / PNG，最多 5 个，单文件 ≤ 200M">
                  <QuestionCircleOutlined class="upload-hint-icon" />
                </a-tooltip>
              </template>
              <FileUploadField v-model:file-list="form.propertyFiles" :max-count="5" accept=".pdf,.jpg,.jpeg,.png" multiple>
                <a-button><template #icon><UploadOutlined /></template>点击上传</a-button>
              </FileUploadField>
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

        <!-- 合同付款比例 TAB -->
        <a-tab-pane key="payment" tab="合同付款比例" force-render>
          <div style="padding: 28px 0 12px">

            <a-alert v-if="!isAnneng" type="warning" show-icon
              message="当前账号为代理商账号，付款比例信息只读，不可编辑"
              style="margin-bottom:20px" />
            <a-alert v-if="projectStarted" type="info" show-icon
              message="项目已开工，付款比例信息不可再编辑"
              style="margin-bottom:20px" />

            <div v-for="(contract, idx) in paymentContracts" :key="idx" class="payment-contract-card">
              <div class="payment-contract-header">
                <div class="payment-contract-type">{{ contract.type }}</div>
                <div class="payment-contract-meta-row">
                  <span class="payment-meta-item">
                    <span class="payment-meta-label">合同编号</span>
                    <span class="payment-meta-value">{{ contract.contractNo || '—' }}</span>
                  </span>
                  <span class="payment-meta-item">
                    <span class="payment-meta-label">合同签订金额</span>
                    <span class="payment-meta-value">{{ contract.amount != null ? `¥${Number(contract.amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : '—' }}</span>
                  </span>
                  <span class="payment-meta-item">
                    <span class="payment-meta-label">甲方</span>
                    <span class="payment-meta-value">{{ contract.partyA || '—' }}</span>
                  </span>
                  <span class="payment-meta-item">
                    <span class="payment-meta-label">乙方</span>
                    <span class="payment-meta-value">{{ contract.partyB || '—' }}</span>
                  </span>
                  <span class="payment-meta-item">
                    <span class="payment-meta-label">结算对象类型</span>
                    <a-select
                      v-model:value="contract.payment.settlementType"
                      placeholder="请选择"
                      size="small"
                      style="width:130px"
                      :disabled="!isAnneng || projectStarted">
                      <a-select-option v-for="t in SETTLEMENT_TYPES" :key="t" :value="t">{{ t }}</a-select-option>
                    </a-select>
                  </span>
                </div>
              </div>

              <table class="payment-ratio-table">
                <thead>
                  <tr>
                    <th style="width:80px"></th>
                    <th v-for="row in contract.payment.nodes" :key="row.node">{{ row.node }}</th>
                    <th style="width:100px">合计</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="payment-row-label">付款比例</td>
                    <td v-for="row in contract.payment.nodes" :key="row.node">
                      <a-input-number
                        v-model:value="row.ratio"
                        :min="0" :max="100" :precision="0"
                        style="width:100%"
                        addon-after="%"
                        :disabled="!isAnneng || projectStarted" />
                    </td>
                    <td :class="['payment-total-cell', { 'ratio-sum-error': paymentNodeTotal(contract.payment.nodes) > 0 && paymentNodeTotal(contract.payment.nodes) !== 100 }]">
                      {{ paymentNodeTotal(contract.payment.nodes) }}%
                      <div v-if="paymentNodeTotal(contract.payment.nodes) > 0 && paymentNodeTotal(contract.payment.nodes) !== 100" class="ratio-sum-hint">需等于100%</div>
                    </td>
                  </tr>
                  <tr>
                    <td class="payment-row-label">付款金额</td>
                    <td v-for="row in contract.payment.nodes" :key="row.node" class="payment-amount-cell">
                      {{ calcNodeAmount(contract.amount, row.ratio) }}
                    </td>
                    <td class="payment-amount-cell">—</td>
                  </tr>
                </tbody>
              </table>
            </div>

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
import { LeftOutlined, PlusOutlined, UploadOutlined, QuestionCircleOutlined, DownOutlined } from '@ant-design/icons-vue'
import FileUploadField from '../components/FileUploadField.vue'
import FileAttachmentView from '../components/FileAttachmentView.vue'

const props = defineProps<{
  editId?: string | null
  initStatus?: string | null
  initData?: {
    projectType:   'emc' | 'public_emc'
    policyMatched: boolean
    projectName:   string
    oaNo:          string
  } | null
}>()
const emit = defineEmits<{ back: [] }>()

const STATUS_COLOR: Record<string, string> = {
  filing: 'processing', pending_review: 'processing', rejected: 'error',
  approved: 'success', voided: 'default',
}
const STATUS_LABEL: Record<string, string> = {
  filing: '建档中', pending_review: '建档审核中', rejected: '建档审核不通过',
  approved: '建档已通过', voided: '已作废',
}

const isEdit     = computed(() => !!props.editId)
const filingStatus = ref<string | null>(props.initStatus ?? null)
const rejectInfo = reactive({
  stage: '建档审核', reviewer: '李四（审核员）',
  time: '2026-08-11 15:30', reason: 'EMC 电价填写有误，当前区域标准电价为 0.6200 元/kWh，请核实后重新提交。',
})
const projectInfoOpen = ref(true)
const saving     = ref(false)
const submitting = ref(false)
const formRef    = ref()

const canVoid = computed(() =>
  filingStatus.value != null && ['filing', 'rejected'].includes(filingStatus.value)
)

// OA 自动带出的只读数据（实际从接口获取，此处 mock）
const OA_DATA_MAP: Record<string, any> = {
  'A304202607100012': {
    oaNo: 'A304202607100012',
    projectName: '杭州滨江区某商业综合体屋顶光伏EMC项目',
    projectType: 'public_emc',
    region: ['浙江省', '杭州市', '滨江区'],
    gridVoltage: 'low',
    emcYears: 20,
    agentName: '浙江绿能科技有限公司',
    enterpriseName: '杭州某商业综合体管理有限公司',
    emcPrice: 0.6500,
    absorptionRatio: 70,
  },
}

const DEFAULT_OA = {
  oaNo: props.initData?.oaNo ?? '',
  projectName: props.initData?.projectName ?? '',
  projectType: props.initData?.projectType ?? 'emc',
  region: [] as string[],
  gridVoltage: 'low',
  emcYears: 20,
  agentName: '',
  enterpriseName: '',
  emcPrice: 0,
  absorptionRatio: 0,
}

const oaData = reactive({ ...DEFAULT_OA, ...(OA_DATA_MAP[props.initData?.oaNo ?? ''] ?? {}) })

// 可编辑字段
const form = reactive({
  capacity:           0 as number | null,
  addressDetail:      '',
  publicBuildingType: null as string | null,
  developerName:      '',
  contractorName:     '',
  propertyFiles:      [] as any[],
})

function validatePropertyFiles(_: any, value: any[]) {
  return value && value.length > 0 ? Promise.resolve() : Promise.reject('请上传产权证明文件')
}

const handleBack   = () => emit('back')

const handleSave   = async () => {
  saving.value = true
  try {
    await new Promise(r => setTimeout(r, 600))
    message.success('保存成功')
    filingStatus.value = 'filing'
  } catch {
    message.error('保存失败，请重试')
  } finally { saving.value = false }
}

const handleSubmit = async () => {
  try { await formRef.value?.validate() } catch { return }
  submitting.value = true
  try {
    await new Promise(r => setTimeout(r, 800))
    message.success('提交成功，等待审核')
    filingStatus.value = 'pending_review'
  } catch {
    message.error('提交失败，请重试')
  } finally { submitting.value = false }
}

const handleVoid = async () => {
  try {
    await new Promise(r => setTimeout(r, 500))
    message.success('已作废')
    filingStatus.value = 'voided'
  } catch {
    message.error('作废失败，请重试')
  }
}

// ── 勘察 tab ──────────────────────────────────────────────

const SURVEY_PHOTO_CATS = [
  { key: 'aerialPhotos',        label: '航拍图' },
  { key: 'roofPeripheryPhotos', label: '屋面周边照片' },
  { key: 'roofPhotos',          label: '屋面照片' },
  { key: 'houseFrontPhotos',    label: '房屋正面照片' },
  { key: 'factoryPhotos',       label: '厂房内部照片' },
]

const surveyRef = ref()
const survey = reactive({
  siteLayoutFiles:       [] as any[],
  buildingCount:         null as number | null,
  roofLightSteel:        null as number | null,
  roofConcrete:          null as number | null,
  roofOther:             null as number | null,
  steelRoofType:         null as string | null,
  rustCondition:         null as string | null,
  hasObstacle:           null as string | null,
  obstacleHeight:        null as number | null,
  obstacleWidth:         null as number | null,
  hasSkylight:           null as string | null,
  skylightWidth:         null as number | null,
  inletVoltage:          null as number | null,
  inletConnectionType:   null as string | null,
  circuitCount:          null as number | null,
  cableSpec:             null as number | null,
  transformerCount:      null as number | null,
  transformerKVA:        null as number | null,
  hasInterval:           null as string | null,
  hasIndoorSpace:        null as string | null,
  indoorLength:          null as number | null,
  indoorWidth:           null as number | null,
  hasCablePipe:          null as string | null,
  cablePipeType:         null as string | null,
  aerialPhotos:          [] as any[],
  roofPeripheryPhotos:   [] as any[],
  roofPhotos:            [] as any[],
  houseFrontPhotos:      [] as any[],
  factoryPhotos:         [] as any[],
  drawingFiles:          [] as any[],
  electricityFiles:      [] as any[],
  approvalFiles:         [] as any[],
})

const noopRequest = ({ onSuccess }: any) => { setTimeout(() => onSuccess?.('ok'), 0) }

// ── 设计 tab ──────────────────────────────────────────────

const SCENE_TYPES = ['彩钢瓦', '阵列式', '阳光房']
const SPECIAL_PLAN_OPTIONS = ['车棚', 'BIPV', '光伏幕墙']
const GRID_MODE_OPTIONS = [
  { value: 'full_grid',  label: '全额上网' },
  { value: 'surplus',    label: '余电上网' },
  { value: 'no_surplus', label: '余电不上网' },
  { value: 'offgrid',    label: '离网' },
]

const design = reactive({
  jiagongBom:  [] as any[],
  yigongBom:   [] as any[],
  gridMode:    null as string | null,
  scenes: [{ type: null as string | null, blocks: null as number | null, tiltAngle: null as number | null, specialPlan: null as string | null }] as { type: string | null, blocks: number | null, tiltAngle: number | null, specialPlan: string | null }[],
  designQualFiles:       [] as any[],
  electricalDesignFiles: [] as any[],
  structuralDesignFiles: [] as any[],
  safetyAssessFiles:     [] as any[],
  otherAttachFiles:      [] as any[],
})

const addScene = () => { if (design.scenes.length < SCENE_TYPES.length) design.scenes.push({ type: null, blocks: null, tiltAngle: null, specialPlan: null }) }
const removeScene = (idx: number) => { if (design.scenes.length > 1) design.scenes.splice(idx, 1) }

const jiagongComponentQty = computed(() =>
  design.jiagongBom.filter((m: any) => m.group === '组件').reduce((sum: number, m: any) => sum + (m.quantity || 0), 0)
)
const totalSceneBlocks = computed(() =>
  design.scenes.reduce((sum, s) => sum + (s.blocks || 0), 0)
)
const sceneBlocksMatch = computed(() =>
  jiagongComponentQty.value > 0 && totalSceneBlocks.value === jiagongComponentQty.value
)

const sceneColumns = [
  { title: '序号',          key: 'index',       width: 60,  customRender: ({ index }: { index: number }) => index + 1 },
  { title: '*应用场景',     key: 'type',        width: 160 },
  { title: '*应用场景块数', key: 'blocks',      width: 140 },
  { title: '*倾角',         key: 'tiltAngle',   width: 130 },
  { title: '特殊方案',      key: 'specialPlan', width: 160 },
  { title: '操作',          key: 'action',      width: 70 },
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
  { title: '序号',     key: 'index',       width: 60,  customRender: ({ index }: { index: number }) => index + 1 },
  { title: '物料编码', dataIndex: 'code',  key: 'code' },
  { title: '物料名称', dataIndex: 'name',  key: 'name', ellipsis: true },
  { title: '物料组',   dataIndex: 'group', key: 'group' },
  { title: '单位',     dataIndex: 'unit',  key: 'unit' },
  { title: 'BOM类型',  key: 'bomType',     customRender: () => '电器BOM' },
  { title: '确认数量', key: 'quantity',    width: 130, fixed: 'right' },
  { title: '操作',     key: 'action',      width: 80,  fixed: 'right' },
]

const removeBomRow = (type: 'jiagong' | 'yigong', idx: number) => {
  const map = { jiagong: 'jiagongBom', yigong: 'yigongBom' } as const
  design[map[type]].splice(idx, 1)
}
const handleBomImport = (file: any) => { message.info(`导入文件：${file.name}`); return false }

// ── 商务 tab ──────────────────────────────────────────────

const PAYMENT_CATEGORIES = ['应收款项', '应付款项']
const SUPPLIER_OPTIONS = [
  { value: '浙江正泰新能源开发有限公司', label: '浙江正泰新能源开发有限公司' },
  { value: '浙江某甲供应商有限公司',     label: '浙江某甲供应商有限公司' },
  { value: '杭州某能源集团有限公司',     label: '杭州某能源集团有限公司' },
]
const PROJECT_COMPANY_OPTIONS = [
  { value: 'hz_pv', label: '杭州绿源光伏资产管理有限公司' },
  { value: 'nb_pv', label: '宁波蓝天新能源股份有限公司' },
  { value: 'nj_pv', label: '南京晴天绿色能源科技有限公司' },
  { value: 'sh_pv', label: '上海启明光电资产有限公司' },
  { value: 'sz_pv', label: '苏州联合光伏投资有限公司' },
  { value: 'cz_pv', label: '常州鼎盛新能源管理有限公司' },
  { value: 'wz_pv', label: '温州海澄光伏资产有限公司' },
  { value: 'jx_pv', label: '嘉兴浩天清洁能源有限公司' },
  { value: 'hf_pv', label: '合肥瑞阳光伏资产运营有限公司' },
  { value: 'wx_pv', label: '无锡华诚新能源股份有限公司' },
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
    partyA: '', partyB: '', amount: null as number | null, signDate: null as any, remark: '', files: [] as any[],
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

// ── 备案 tab ──────────────────────────────────────────────

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
  { title: '备案证项目代码',      dataIndex: 'projectCode',       key: 'projectCode',       width: 140 },
  { title: '备案证项目名称',      dataIndex: 'projectName',       key: 'projectName',       ellipsis: true },
  { title: '备案证编号',          dataIndex: 'certNo',            key: 'certNo',            width: 130 },
  { title: '备案容量(W)',         dataIndex: 'capacity',          key: 'capacity',          width: 110 },
  { title: '并网剩余可用容量(W)', dataIndex: 'availableCapacity', key: 'availableCapacity', width: 150 },
  { title: '备案证类型',          dataIndex: 'certType',          key: 'certType',          width: 110 },
  { title: '操作',                key: 'action',                  width: 70 },
]
const openFilingCertModal = () => { certSearch.value = ''; certModalVisible.value = true }
const selectCert = (cert: any) => { record.filingCert = cert; certModalVisible.value = false }
const clearFilingCert = () => { record.filingCert = null }

// ── 物料弹窗 ──────────────────────────────────────────────

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
  { code: 'TB0002', name: '400kVA柱上变压器',             unit: '台',  category: '中高压', subCategory: '变压器', confirmQty: null },
  { code: 'XB0001', name: '600kVA干变',                   unit: '台',  category: '中高压', subCategory: '变压器', confirmQty: null },
  { code: 'TJ0080', name: '台架变',                       unit: '台',  category: '低压',   subCategory: '接线端子', confirmQty: null },
  { code: '100009', name: '台架变压器',                   unit: '台',  category: '中高压', subCategory: '变压器', confirmQty: null },
  { code: '100005', name: '宁德时代100度磷酸铁锂储能电池', unit: 'PCS', category: '中高压', subCategory: '储能',  confirmQty: null },
]
const jiagongMaterialColumns = [
  { title: '物料编码', dataIndex: 'code',  key: 'code',    width: 110 },
  { title: '物料名称', dataIndex: 'name',  key: 'name',    ellipsis: true },
  { title: '物料组',   dataIndex: 'group', key: 'group',   width: 90 },
  { title: '单位',     dataIndex: 'unit',  key: 'unit',    width: 60 },
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

// ── 合同付款比例 ───────────────────────────────────────────

const PAYMENT_NODES = ['开工', '并网', '竣工验收', '质保金']
const SETTLEMENT_TYPES = ['开发方', '施工方', '设计院', '设备采购方', '监理方']

// mock 权限标志：实际由登录账号类型判断
const isAnneng = ref(true)
const projectStarted = ref(false)

interface PaymentNodeRow { node: string; ratio: number | null }
interface ContractPayment { settlementType: string | null; nodes: PaymentNodeRow[] }

const makeNodes = (): PaymentNodeRow[] => PAYMENT_NODES.map(n => ({ node: n, ratio: null }))
const makeContract = (): ContractPayment => ({ settlementType: null, nodes: makeNodes() })

const paymentRatio = reactive({
  smallE: makeContract(),
  design: makeContract(),
  others: [] as ContractPayment[]
})

watch(
  () => commercial.otherContracts.length,
  (newLen: number) => {
    while (paymentRatio.others.length < newLen) paymentRatio.others.push(makeContract())
    while (paymentRatio.others.length > newLen) paymentRatio.others.pop()
  },
  { immediate: true }
)

const paymentContracts = computed(() => [
  {
    type: '小E施工承包合同（常规EMC）',
    contractNo: commercial.smallEContract.contractNo,
    amount: commercial.smallEContract.amount,
    partyA: commercial.smallEContract.partyA,
    partyB: commercial.smallEContract.partyB,
    payment: paymentRatio.smallE
  },
  {
    type: '设计合同',
    contractNo: commercial.designContract.contractNo,
    amount: commercial.designContract.amount,
    partyA: commercial.designContract.partyA,
    partyB: commercial.designContract.partyB,
    payment: paymentRatio.design
  },
  ...commercial.otherContracts.map((c: any, i: number) => ({
    type: `其他合同${i + 1}`,
    contractNo: c.contractNo,
    amount: c.amount,
    partyA: c.partyA,
    partyB: c.partyB,
    payment: paymentRatio.others[i] ?? makeContract()
  }))
])

const paymentNodeTotal = (nodes: PaymentNodeRow[]) =>
  nodes.reduce((s, n) => s + (n.ratio ?? 0), 0)

const calcNodeAmount = (amount: number | null | undefined, ratio: number | null) => {
  if (amount == null || ratio == null) return '—'
  const val = amount * ratio / 100
  return `¥${val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ── Tabs ──────────────────────────────────────────────────

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
  // 编辑模式：从接口加载已有数据
  await new Promise(r => setTimeout(r, 300))
  Object.assign(form, {
    capacity: 320,
    addressDetail: '××路×号商业综合体楼顶',
    developerName: '浙江华电开发有限公司',
    contractorName: '杭州建工集团有限公司',
  })
  Object.assign(oaData, OA_DATA_MAP['A304202607100012'] ?? {})
  filingStatus.value = props.initStatus ?? 'filing'
  if (filingStatus.value === 'rejected') {
    Object.assign(rejectInfo, {
      stage: '建档审核', reviewer: '李四（审核员）',
      time: '2026-08-11 15:30', reason: 'EMC 电价填写有误，当前区域标准电价为 0.6200 元/kWh，请核实后重新提交。',
    })
  }
})

onUnmounted(() => {
  if (_scrollHandler) filingBodyRef.value?.removeEventListener('scroll', _scrollHandler)
})
</script>

<style scoped>
.filing-page {
  height: calc(100vh - 81px);
  overflow: hidden;
  background: #f5f6fa;
  display: flex;
  flex-direction: column;
}

.filing-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 160px;
  padding: 0 24px;
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}
.filing-header-left { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; overflow: hidden; }
.filing-header-left :deep(.ant-tag) { flex-shrink: 0; margin-inline-end: 0; }
.back-btn { color: #595959; flex-shrink: 0; }
.filing-title { font-size: 16px; font-weight: 600; margin-left: 4px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 1; }

.filing-body { flex: 1; overflow-y: auto; padding: 0 16px 16px; overscroll-behavior: contain; }
.main-card { margin-top: 16px; border-radius: 8px; }
.tabs-wrapper { background: #fff; border-radius: 8px; margin-top: 16px; }

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

/* ── Section 标题 ── */
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

.section-sub-title {
  font-size: 16px;
  font-weight: 500;
  color: rgba(0,0,0,0.88);
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

/* OA 只读提示 */
.oa-hint {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
  line-height: 1.4;
}

/* upload icon */
.upload-hint-icon {
  font-size: 13px;
  color: #8c8c8c;
  cursor: pointer;
  margin-left: 4px;
}

/* ── Sub-section hints & header ── */
.sub-hint {
  font-size: 12px;
  font-weight: 400;
  color: #8c8c8c;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* ── form item ── */
:deep(.ant-form-item-label > label),
:deep(.ant-form-item-label > label.ant-form-item-required) {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  height: auto;
}
:deep(.ant-form-vertical .ant-form-item) {
  margin-bottom: 20px;
}

/* ── 勘察辅助标签 ── */
.roof-type-label { font-size: 14px; color: rgba(0,0,0,0.88); white-space: nowrap; }
.cond-label      { font-size: 14px; color: rgba(0,0,0,0.65); white-space: nowrap; }

/* ── 勘察照片 upload trigger ── */
.upload-trigger {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #8c8c8c; font-size: 20px;
}

/* ── 应用场景 ── */
.scene-blocks-hint { display: flex; align-items: center; gap: 16px; margin-top: 8px; font-size: 13px; color: rgba(0,0,0,0.65); }
.scene-blocks-hint b { color: rgba(0,0,0,0.88); }
.hint-error { color: #ff4d4f; }

/* ── 合同块 ── */
.contract-block { border: 1px solid #f0f0f0; border-radius: 6px; margin-bottom: 16px; overflow: hidden; }
.contract-block-header { display: flex; align-items: center; background: #f5f5f5; padding: 8px 16px; font-size: 14px; font-weight: 500; color: rgba(0,0,0,0.88); }
.contract-block-body { padding: 20px 16px 4px; }

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
.cert-info-label {
  font-size: 14px; color: rgba(0,0,0,0.45);
  line-height: 22px; padding-bottom: 8px; white-space: nowrap;
}
.cert-info-value {
  font-size: 14px; color: rgba(0,0,0,0.88);
  line-height: 22px; word-break: break-word;
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
.form-tabs :deep(.ant-divider-horizontal) { margin: 0 0 20px; }

/* ── 合同付款比例 ── */
.payment-contract-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
}
.payment-contract-header {
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
}
.payment-contract-type {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 10px;
}
.payment-contract-meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 24px;
}
.payment-meta-item { display: flex; align-items: center; gap: 4px; font-size: 13px; }
.payment-meta-label { color: #8c8c8c; }
.payment-meta-value { color: #262626; }
.payment-ratio-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.payment-ratio-table th {
  padding: 10px 12px;
  text-align: left;
  background: #f5f5f5;
  color: #595959;
  font-weight: 500;
  border-bottom: 1px solid #e8e8e8;
}
.payment-ratio-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}
.payment-ratio-table tbody tr:last-child td { border-bottom: none; }
.payment-row-label { color: #8c8c8c; font-size: 13px; white-space: nowrap; }
.payment-amount-cell { color: #262626; font-variant-numeric: tabular-nums; }
.payment-total-cell { font-weight: 600; color: #262626; }
.ratio-sum-error { color: #ff4d4f; }
.ratio-sum-hint { font-size: 12px; font-weight: 400; margin-top: 2px; }
</style>
