import { LightningElement, wire, track } from 'lwc';
import getparamid from '@salesforce/apex/ScoreCardProject.getparamid';
import getbusinessarea from '@salesforce/apex/ScoreCardProject.getbusinessarea';
import getbusiness from '@salesforce/apex/ScoreCardProject.getbusiness';
import insertscorecard from '@salesforce/apex/ScoreCardProject.insertscorecard';
import updatescorecard from '@salesforce/apex/ScoreCardProject.UpdateScorecard';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UserNameFIELD from '@salesforce/schema/User.Name';
import userSalesFIELD from '@salesforce/schema/User.Sales_Area_Text__c';
import PROFILE_NAME_FIELD from '@salesforce/schema/User.Profile.Name';

export default class ScoreCardProject extends LightningElement {

    currentDate = new Date();
    options = { month: 'short' };
    formattedMonth = new Intl.DateTimeFormat('en-US',this.options).format(this.currentDate).toUpperCase();
    @track month = this.formattedMonth;
    @track year = new Date().getFullYear().toString();
    getAccId;
    Business = null;
    sales = null;
    Paramdata = [];
    @track salesarea = [];
    Bvalue = [];
    dataset =[];
    error;
    @track data = [];
    isdata = false;
    loaded = false;
    currentUsersales;
    currentUserName;
    prfName;
    @track readonly = false;
    userdata = [];
    @wire(getRecord, { recordId: Id, fields: [UserNameFIELD, userSalesFIELD,PROFILE_NAME_FIELD]}) 
    currentUserInfo({error, data}) {
        if (data) {
            this.userdata = data;
            console.log('userdata==='+JSON.stringify(this.userdata));
            this.currentUserName = data.fields.Name.value;
            this.currentUsersales = data.fields.Sales_Area_Text__c.value;
            this.prfName =data.fields.Profile.value.fields.Name.value;
           // this.currentIsActive = data.fields.IsActive.value;
           // this.currentUserAlias = data.fields.Alias.value;
           console.log('userSALES======'+this.prfName);

        } else if (error) {
            this.error = error ;
        }
    }

    @wire(getbusiness)
    businessvalue({ data, error }) {
        if (data) {
            console.log('data T');
            this.Bvalue = data.map(value => ({ label: value, value: value }));

        }
        if (error) {
            this.error = error;
        }
    }
    @wire(getparamid)
    paramid({ data, error }){
        console.log('Hi...');
        if(data){
            this.Paramdata = data;
            console.log('Pid'+JSON.stringify(this.Paramdata));
        }
        if(error){
            this.error = error;
            
        }
    }

    handlebusinessChange(event) {
        this.Business = event.target.value;
        getbusinessarea({ Business: this.Business })
            .then(result => {
                console.log('result' + result);
                if(this.prfName == 'System Administrator'){
                this.salesarea = result.map(value => ({ label: value, value: value }));
                this.readonly = false;
                }else{
                this.salesarea = this.currentUsersales.split(',');
                this.salesarea = this.salesarea.map(value => ({ label: value, value: value }));
                console.log('salesarea====='+JSON.stringify(this.salesarea));
                this.readonly = true;
                }

            })
            .catch(error => {
                this.error = error;
            })
    }

    handlesalesareaChange(event) {
        this.sales = event.target.value;

    }
    handleyearChange(event) {
        this.year = event.target.value;
    }

    handleMonthChange(event) {
        this.month = event.target.value;
    }


    get YearValues() {
        const currentyear = new Date().getFullYear();

        return [
            { label: currentyear - 3, value: String(currentyear - 3) },
            { label: currentyear - 2, value: String(currentyear - 2) },
            { label: currentyear - 1, value: String(currentyear - 1) },
            { label: currentyear,     value: String(currentyear) },
            { label: currentyear + 1, value: String(currentyear + 1) },
            { label: currentyear + 2, value: String(currentyear + 2) },
        ];
    }

    get MonthValues() {
        return [
            { label: 'JAN', value: 'JAN' },
            { label: 'FEB', value: 'FEB' },
            { label: 'MAR', value: 'MAR' },
            { label: 'APR', value: 'APR' },
            { label: 'MAY', value: 'MAY' },
            { label: 'JUN', value: 'JUN' },
            { label: 'JUL', value: 'JUL' },
            { label: 'AUG', value: 'AUG' },
            { label: 'SEP', value: 'SEP' },
            { label: 'OCT', value: 'OCT' },
            { label: 'NOV', value: 'NOV' },
            { label: 'DEC', value: 'DEC' },
        ]
    }
    
    submit() {
        this.loaded = true;
        if(this.Business == null || this.sales == null || this.year ==null || this.month ==null){
            this.error = 'Please Select the required field';
            this.loaded = false;

        }else{
        insertscorecard({ Business: this.Business, sales: this.sales, year: this.year, month: this.month })
            .then(result => {
                this.data = result;
                if(this.data == null ||this.data == ''){
                    this.error = 'No key Parameters available';
                }else{
                this.data = result.map((row,index) => {
                    return { ...row, ParentName: row.Key_Parameters__r.Parent_Name__c,Index:index+1,
                        }
                });
             
                
                this.data.forEach(item => {
                    console.log('AO', item.Key_Parameters__r.ParamID__c);
                    const filteredData = this.Paramdata.filter(p => p.ParamID__c === item.Key_Parameters__r.ParamID__c);
                    console.log('Adata' + JSON.stringify(filteredData));
                    if (filteredData.length > 0 && filteredData[0].ParamID__c === item.Key_Parameters__r.ParamID__c) {
                      console.log('Hello');
                      item.Pid = filteredData[0].Parameter_Name__c;
                      console.log('parent' + filteredData[0].Parameter_Name__c);
                    } else {
                      item.Pid = '';
                    }
                  });
                  
                console.log('Hijake'+JSON.stringify(this.data));
                this.isdata = true;
                this.loaded = false;
                this.error = undefined;
                }
            })
            .catch(error => {
                this.error = error;
                this.loaded = false;
            })
    }
}


    handletargetChange(event) {
        var selectedRow = event.currentTarget;
        var key = selectedRow.dataset.id;
        console.log('fsg' + key);
        this.data[key].Target__c = event.target.value;
        const score = ((this.data[key].Actuals__c/this.data[key].Target__c)*(this.data[key].Weightage__c));
        if(score>0){
        if(this.data[key].Param_Name__c =='Sales'){
            this.data[key].Score__c = score.toFixed(2);
            
        }else{
            this.data[key].Score__c = score > this.data[key].Weightage__c?this.data[key].Weightage__c:(score.toFixed(2));
            
        }
    }
        console.log('$$$' + this.data);
    }
    handlequalifierChange(event) {
        var selectedRow = event.currentTarget;
        var key = selectedRow.dataset.id;
        this.data[key].Minimum_Qualifier__c = event.target.value;
        console.log('$$$' + JSON.stringify(this.data));
    }
    handleweightageChange(event) {
        var selectedRow = event.currentTarget;
        var key = selectedRow.dataset.id;
        this.data[key].Weightage__c = event.target.value;
        const score = ((this.data[key].Actuals__c/this.data[key].Target__c)*(this.data[key].Weightage__c));
        console.log('score'+score);
        if(score>0){
        if(this.data[key].Param_Name__c =='Sales'){
            this.data[key].Score__c = score.toFixed(2);
            
        }else{
            this.data[key].Score__c = score > this.data[key].Weightage__c?this.data[key].Weightage__c:(score.toFixed(2));
        
        }
    }
        console.log('$$$' + JSON.stringify(this.data));
    }
    handleactuvalsChange(event) {
        var selectedRow = event.currentTarget;
        var key = selectedRow.dataset.id;
        this.data[key].Actuals__c = event.target.value;
        const score = ((this.data[key].Actuals__c/this.data[key].Target__c)*(this.data[key].Weightage__c));
        if(score>0){
        if(this.data[key].Param_Name__c =='Sales'){
            this.data[key].Score__c = score.toFixed(2);
            
        }else{
            this.data[key].Score__c = score > this.data[key].Weightage__c?this.data[key].Weightage__c:(score.toFixed(2));
        
        }
    }
        console.log('$$$' + JSON.stringify(this.data));
    }

    save() {
        this.loaded = true;
        updatescorecard({ updatedata: this.data })
            .then(result => {
                this.loaded = false;
                console.log('result'+result)
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success!!',
                        message: 'Targets are updated sucessfully',
                        variant: 'Success',
                    }),
                );
            

            })
            .catch(error =>{
                this.error = error;
                this.loaded = false;
            })
    }
}
